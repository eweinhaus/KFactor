import { db } from '@/lib/firebase-admin';
import type { 
  AgentDecision, 
  PracticeResult, 
  EventContext, 
  DecisionContext 
} from '@/types';
import type { FirebaseFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

/**
 * Loop Orchestrator Agent
 * 
 * Makes intelligent decisions about when to trigger viral loop prompts
 * based on eligibility rules, rate limits, and contextual factors.
 * 
 * All decisions are logged synchronously to Firestore for auditability.
 */
export class LoopOrchestrator {
  constructor(private db: FirebaseFirestore.Firestore) {}

  /**
   * Main decision method - evaluates all eligibility rules and returns decision
   * 
   * @param userId - User ID making the request
   * @param event - Event context (practice_completed or invite_requested)
   * @returns AgentDecision with shouldTrigger, rationale, and features_used
   */
  async decide(
    userId: string,
    event: EventContext
  ): Promise<AgentDecision & { decisionId: string }> {
    const featuresUsed: string[] = [];
    const context: DecisionContext = {
      userId,
      eventType: event.type,
      eventId: event.resultId,
    };

    try {
      // Rule 1: Practice Test Completion Check
      const practiceResult = await this.checkPracticeCompletion(event.resultId);
      featuresUsed.push('practice_completion_check');
      
      if (!practiceResult) {
        const decision: AgentDecision = {
          shouldTrigger: false,
          rationale: 'No practice test completion found',
          features_used: featuresUsed,
        };
        const decisionId = await this.logDecision(decision, context);
        return { ...decision, decisionId };
      }

      // Use score from practice result if not provided in event
      const score = event.score ?? practiceResult.score;
      context.score = score;
      featuresUsed.push('practice_score');

      // Rule 2 & 3: Run rate limit and cooldown checks in parallel
      const [invitesToday, lastInviteTime] = await Promise.all([
        this.getInviteCountToday(userId),
        this.getLastInviteTime(userId),
      ]);

      featuresUsed.push('invite_count_today');
      context.invitesToday = invitesToday;

      // Rule 2: Rate Limiting (Daily Limit)
      if (invitesToday >= 3) {
        const decision: AgentDecision = {
          shouldTrigger: false,
          rationale: `Rate limit reached (${invitesToday}/3 invites today)`,
          features_used: featuresUsed,
        };
        const decisionId = await this.logDecision(decision, context);
        return { ...decision, decisionId };
      }

      // Rule 3: Cooldown Period Check
      if (lastInviteTime) {
        const hoursSince = this.calculateHoursSince(lastInviteTime);
        context.lastInviteHoursAgo = hoursSince;
        featuresUsed.push('last_invite_timestamp');

        if (hoursSince < 1) {
          const minutesSince = Math.floor(hoursSince * 60);
          const decision: AgentDecision = {
            shouldTrigger: false,
            rationale: `Cooldown period active (last invite ${minutesSince} minutes ago)`,
            features_used: featuresUsed,
          };
          const decisionId = await this.logDecision(decision, context);
          return { ...decision, decisionId };
        }
      } else {
        featuresUsed.push('last_invite_timestamp');
      }

      // Rule 4: Score Threshold Check
      if (score < 50) {
        const decision: AgentDecision = {
          shouldTrigger: false,
          rationale: `Score too low (${score}%), may discourage sharing`,
          features_used: featuresUsed,
        };
        const decisionId = await this.logDecision(decision, context);
        return { ...decision, decisionId };
      }

      // All rules pass - trigger
      const decision: AgentDecision = {
        shouldTrigger: true,
        rationale: `User scored ${score}% on practice test, ${invitesToday}/3 invites used today${
          lastInviteTime ? `, last invite ${Math.floor(this.calculateHoursSince(lastInviteTime) * 60)} minutes ago` : ', no previous invites'
        }`,
        loopType: 'buddy_challenge',
        features_used: featuresUsed,
      };
      const decisionId = await this.logDecision(decision, context);
      return { ...decision, decisionId };
    } catch (error) {
      // Graceful degradation: default to skip on any error
      console.error('LoopOrchestrator error:', error);
      featuresUsed.push('error_fallback');
      
      const decision: AgentDecision = {
        shouldTrigger: false,
        rationale: 'System error, defaulting to skip',
        features_used: featuresUsed,
      };
      
      try {
        const decisionId = await this.logDecision(decision, context);
        return { ...decision, decisionId };
      } catch (logError) {
        // Even if logging fails, return decision (don't block user flow)
        console.error('Failed to log decision:', logError);
        return { ...decision, decisionId: 'log_failed' };
      }
    }
  }

  /**
   * Rule 1: Check if practice result exists and is completed
   */
  private async checkPracticeCompletion(resultId: string): Promise<PracticeResult | null> {
    try {
      const resultDoc = await this.db.collection('practice_results').doc(resultId).get();
      
      if (!resultDoc.exists) {
        return null;
      }

      const data = resultDoc.data();
      if (!data || !data.completed_at) {
        return null;
      }

      return {
        id: resultDoc.id,
        user_id: data.user_id,
        score: data.score,
        skill_gaps: data.skill_gaps || [],
        completed_at: data.completed_at,
      } as PracticeResult;
    } catch (error) {
      console.error('Error checking practice completion:', error);
      return null;
    }
  }

  /**
   * Rule 2: Get invite count for user today (UTC)
   */
  private async getInviteCountToday(userId: string): Promise<number> {
    try {
      // Calculate UTC midnight for today
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const invitesSnapshot = await this.db
        .collection('invites')
        .where('inviter_id', '==', userId)
        .where('created_at', '>=', todayStart)
        .get();

      return invitesSnapshot.size;
    } catch (error) {
      console.error('Error getting invite count today:', error);
      // Return 0 on error (safer to allow invite than block)
      return 0;
    }
  }

  /**
   * Rule 3: Get timestamp of last invite for user
   */
  private async getLastInviteTime(userId: string): Promise<Date | null> {
    try {
      const lastInviteSnapshot = await this.db
        .collection('invites')
        .where('inviter_id', '==', userId)
        .orderBy('created_at', 'desc')
        .limit(1)
        .get();

      if (lastInviteSnapshot.empty) {
        return null;
      }

      const data = lastInviteSnapshot.docs[0].data();
      const createdAt = data.created_at;

      // Convert Firestore Timestamp to Date
      if (createdAt && typeof createdAt.toDate === 'function') {
        return createdAt.toDate();
      } else if (createdAt instanceof Date) {
        return createdAt;
      } else {
        // Fallback: assume it's a timestamp
        return new Date(createdAt);
      }
    } catch (error: any) {
      // Check if error is due to missing index
      if (error?.code === 9 || error?.message?.includes('index')) {
        console.error('Error getting last invite time: Missing Firestore index. Please deploy indexes: npm run deploy:firestore');
        console.error('Index required for: invites collection - inviter_id + created_at');
        // Return null to allow graceful degradation (skip cooldown check)
        // In production, this should be caught and handled more strictly
        return null;
      }
      console.error('Error getting last invite time:', error);
      return null;
    }
  }

  /**
   * Calculate hours since a given timestamp
   */
  private calculateHoursSince(timestamp: Date): number {
    const now = Date.now();
    const then = timestamp.getTime();
    return (now - then) / (1000 * 60 * 60);
  }

  /**
   * Log decision to Firestore for auditability
   * 
   * @param decision - The decision made by the orchestrator
   * @param context - Context information for logging
   * @returns Decision document ID
   */
  private async logDecision(
    decision: AgentDecision,
    context: DecisionContext
  ): Promise<string> {
    try {
      // Build context object with only defined values (Firestore doesn't allow undefined)
      const contextObj: {
        score?: number;
        invites_today?: number;
        last_invite_hours_ago?: number;
      } = {};
      if (context.score !== undefined) {
        contextObj.score = context.score;
      }
      if (context.invitesToday !== undefined) {
        contextObj.invites_today = context.invitesToday;
      }
      if (context.lastInviteHoursAgo !== undefined) {
        contextObj.last_invite_hours_ago = context.lastInviteHoursAgo;
      }

      const decisionDoc = {
        user_id: context.userId,
        event_type: context.eventType,
        event_id: context.eventId,
        decision: decision.shouldTrigger ? 'trigger_buddy_challenge' : 'skip',
        rationale: decision.rationale,
        features_used: decision.features_used,
        context: contextObj,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.db.collection('decisions').add(decisionDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error logging decision:', error);
      // Don't throw - return a placeholder ID
      return 'log_failed';
    }
  }
}

