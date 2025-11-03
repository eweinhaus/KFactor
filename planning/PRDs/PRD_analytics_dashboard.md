# Product Requirements Document: Analytics Dashboard

**Version:** 1.0  
**Date:** 2025-01-21  
**Feature:** MVP Feature 3.4  
**Status:** Ready for Implementation

---

## 1. Overview

### 1.1 Feature Description
The Analytics Dashboard provides real-time visibility into the viral growth system's performance, displaying K-factor calculations, funnel metrics, and conversion rates. It enables stakeholders to monitor the health of the viral loop and track progress toward growth targets.

### 1.2 Goals
- Display real-time K-factor calculation (target: ≥1.20)
- Track funnel metrics at each stage (sent → opened → accepted → FVM)
- Show conversion rates and drop-off points
- Enable data-driven decision making
- Provide actionable insights for optimization

### 1.3 Success Metrics
- **Accuracy**: K-factor calculation matches manual calculation 100%
- **Performance**: Dashboard loads in <2s
- **Usability**: Metrics clearly displayed and easy to understand
- **Reliability**: 99.9% uptime (no calculation errors)

---

## 2. Key Metrics

### 2.1 Primary Metric: K-Factor

**Definition:** Viral coefficient measuring how many new users each user brings

**Formula:**
```
K = (Invites per User) × (Conversion Rate)

Where:
  Invites per User = Total Invites Sent / Total Users in Cohort
  Conversion Rate = Invites with FVM Reached / Total Invites Sent
```

**Calculation Example:**
```
Cohort: 10 users
Invites Sent: 15
FVM Reached: 12

Invites per User = 15 / 10 = 1.5
Conversion Rate = 12 / 15 = 0.8
K = 1.5 × 0.8 = 1.2 ✅ (Meets target)
```

**Target:** K ≥ 1.20

**Display:**
- Large, prominent display
- Color-coded (green if ≥1.20, red if <1.20)
- Breakdown showing component calculations

### 2.2 Funnel Metrics

**Funnel Stages:**

1. **Sent**: Total invites created
2. **Opened**: Invites where link was clicked (`opened_at` exists)
3. **Accepted**: Invites where user signed up (`invitee_id` exists)
4. **FVM Reached**: Invites where challenge completed (`fvm_reached_at` exists)

**Conversion Rates:**

- **Open Rate** = Opened / Sent
- **Accept Rate** = Accepted / Opened
- **FVM Rate** = FVM Reached / Sent
- **Overall Conversion** = FVM Reached / Sent

**Display Format:**
```
Funnel Visualization:
┌─────────────────────────────────────┐
│ Sent:        15 invites  (100%)     │
│   ↓                                 │
│ Opened:       12 invites  (80%)     │
│   ↓                                 │
│ Accepted:     10 invites  (67%)     │
│   ↓                                 │
│ FVM Reached:   9 invites  (60%)     │
└─────────────────────────────────────┘
```

### 2.3 Supporting Metrics

**User Metrics:**
- Total users (in cohort)
- New users (in time period)
- Active users (sent invite in period)

**Invite Metrics:**
- Invites sent (total)
- Invites sent per user (average)
- Invites accepted (total)
- Invites with FVM reached (total)

**Conversion Metrics:**
- Open rate (%)
- Accept rate (%)
- FVM rate (%)
- Overall conversion (%)

**Time-based Metrics (Future):**
- Daily/weekly trends
- Cohort comparisons
- Retention metrics

---

## 3. Dashboard Design

### 3.1 Layout

**MVP Design (Simple Table):**

```
┌─────────────────────────────────────────────┐
│         Analytics Dashboard                  │
├─────────────────────────────────────────────┤
│                                              │
│  K-Factor: 1.35 ✅ (Target: 1.20)          │
│                                              │
│  Components:                                │
│  • Invites per User: 1.5                    │
│  • Conversion Rate: 0.9                     │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│  User Metrics:                              │
│  • Total Users: 10                          │
│  • New Users (14d): 10                      │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│  Funnel Metrics:                           │
│                                              │
│  Sent:           15 invites                 │
│  Opened:         12 invites  (80.0%)       │
│  Accepted:       10 invites  (66.7%)       │
│  FVM Reached:     9 invites  (60.0%)       │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│  Conversion Rates:                          │
│  • Open Rate: 80.0%                         │
│  • Accept Rate: 66.7%                       │
│  • FVM Rate: 60.0%                          │
│                                              │
└─────────────────────────────────────────────┘
```

### 3.2 Visual Elements

**K-Factor Display:**
- Large number (prominent)
- Color coding:
  - Green if ≥ 1.20 (target met)
  - Yellow if 1.00-1.19 (close)
  - Red if < 1.00 (below target)
- Trend indicator (optional for future: ↑ or ↓)

**Funnel Visualization:**
- Simple table for MVP
- Future: Bar chart or funnel diagram
- Show absolute numbers and percentages
- Highlight drop-off points

**Conversion Rates:**
- Percentage displays
- Color coding:
  - Green if >70%
  - Yellow if 50-70%
  - Red if <50%

### 3.3 Refresh Mechanism

**MVP:** Manual refresh button

**Implementation:**
- "Refresh Data" button
- Re-fetches all metrics
- Shows loading state during refresh

**Future:** Auto-refresh every 30 seconds

---

## 4. Data Calculation (Pre-Calculated Counters)

### 4.1 Analytics Counters Collection

**Approach:** Pre-calculate metrics on events (write) instead of complex queries (read). This dramatically improves performance and simplifies implementation.

**Data Model:**
```typescript
// analytics_counters collection (single document)
{
  id: "main",
  total_users: number;
  total_invites_sent: number;
  total_invites_opened: number;
  total_invites_accepted: number;
  total_fvm_reached: number;
  last_updated: timestamp;
}
```

### 4.2 Counter Updates (On Events)

**When Invite Created:**
```typescript
await db.analytics_counters.update('main', {
  total_invites_sent: increment(1)
});
```

**When Invite Opened:**
```typescript
await db.analytics_counters.update('main', {
  total_invites_opened: increment(1)
});
```

**When Invite Accepted:**
```typescript
await db.analytics_counters.update('main', {
  total_invites_accepted: increment(1)
});
```

**When FVM Reached:**
```typescript
await db.analytics_counters.update('main', {
  total_fvm_reached: increment(1)
});
```

### 4.3 K-Factor Calculation (Simplified)

**Read Counters:**
```typescript
const counters = await db.analytics_counters.get('main');
const totalUsers = await db.users.count(); // Simple count, no filtering

// Calculate K-factor
const invitesPerUser = counters.total_invites_sent / totalUsers;
const conversionRate = counters.total_fvm_reached / counters.total_invites_sent;
const kFactor = invitesPerUser * conversionRate;
```

**MVP Simplification:** Use "All Time" metrics instead of 14-day cohort filtering. This eliminates complex date range queries and still demonstrates the concept.

### 4.4 Funnel Calculation (Simplified)

**Read Counters:**
```typescript
const counters = await db.analytics_counters.get('main');

const sent = counters.total_invites_sent;
const opened = counters.total_invites_opened;
const accepted = counters.total_invites_accepted;
const fvm = counters.total_fvm_reached;

// Calculate rates
const openRate = opened / sent;
const acceptRate = accepted / opened;
const fvmRate = fvm / sent;
```

**Benefits:**
- Single read operation (no complex queries)
- Instant dashboard loads (<100ms)
- No Firestore query limitations to work around
- Simpler to implement and debug

### 4.5 Performance Optimization

**Counters Approach:**
- Update on write (event-driven)
- Single document read for all metrics
- No caching needed (already fast)
- No complex query optimization needed

**Future Enhancement:** Add cohort-specific counters when needed
- Batch queries where possible

---

## 5. API Specifications

### 5.1 Endpoint: GET `/api/analytics`

**Purpose:** Fetch all analytics metrics from pre-calculated counters

**Response:**
```typescript
{
  kFactor: {
    value: number;              // 1.35
    target: number;             // 1.20
    meetsTarget: boolean;       // true
    components: {
      invitesPerUser: number;   // 1.5
      conversionRate: number;   // 0.9
    };
  };
  users: {
    total: number;              // 10
  };
  invites: {
    sent: number;               // 15
    sentPerUser: number;        // 1.5 (average)
    accepted: number;           // 10
    fvmReached: number;         // 9
  };
  funnel: {
    sent: number;               // 15
    opened: number;             // 12
    openedRate: number;         // 0.8 (80%)
    accepted: number;           // 10
    acceptRate: number;         // 0.833 (83.3%)
    fvm: number;                // 9
    fvmRate: number;            // 0.6 (60%)
  };
  metrics: {
    period: "all_time";         // MVP: All-time, future: 14d cohort
    lastUpdated: timestamp;
  };
}
```

**Implementation:**
```typescript
// Fast: Single read from counters + simple user count
const counters = await db.analytics_counters.get('main');
const totalUsers = await db.users.count();

// Calculate metrics
const invitesPerUser = counters.total_invites_sent / totalUsers;
const conversionRate = counters.total_fvm_reached / counters.total_invites_sent;
const kFactor = invitesPerUser * conversionRate;
```

**Response Time:** <1s target

**Error Handling:**
- Database errors → 500, return error message
- Invalid time window → 400
- No data → Return zeros, not error

### 5.2 Query Parameters

**MVP:** No query parameters (all-time metrics only for simplicity)

**Future:**
- `period`: Time window ("7d", "14d", "30d")
- `cohort`: Cohort start date (ISO timestamp)

---

## 6. Frontend Implementation

### 6.1 Dashboard Page

**Route:** `/analytics`

**Components:**

1. **KFactorDisplay**
   - Large K-factor number
   - Color-coded (green/yellow/red)
   - Component breakdown

2. **FunnelMetrics**
   - Table showing funnel stages
   - Conversion rates
   - Drop-off visualization

3. **UserMetrics**
   - Total users (all-time)

4. **RefreshButton**
   - Manual refresh
   - Loading state

### 6.2 Component Structure

```typescript
// Dashboard page
<AnalyticsDashboard>
  <KFactorDisplay kFactor={data.kFactor} />
  <UserMetrics users={data.users} />
  <FunnelMetrics funnel={data.funnel} />
  <RefreshButton onRefresh={fetchAnalytics} />
</AnalyticsDashboard>
```

### 6.3 State Management

**MVP:** React useState

**Data Flow:**
```
1. Component mounts
   ↓
2. Fetch analytics data (GET /api/analytics)
   ↓
3. Display metrics
   ↓
4. User clicks refresh
   ↓
5. Re-fetch and update
```

---

## 7. Data Accuracy

### 7.1 Calculation Verification

**Manual Verification Process:**
1. Export raw data from Firestore
2. Manually calculate K-factor
3. Compare to dashboard display
4. Debug discrepancies

**Edge Cases:**
- Empty cohort (no users) → K-factor = 0, display "No data"
- No invites sent → K-factor = 0
- Division by zero → Handle gracefully

### 7.2 Data Consistency

**Ensures:**
- All funnel stages calculated from same time window
- User counts match invite attribution
- No duplicate counting
- Timestamps accurate

**Validation:**
- Verify `fvmReached <= accepted <= opened <= sent`
- Verify `invitesPerUser >= 0`
- Verify `conversionRate` between 0 and 1

---

## 8. Testing Requirements

### 8.1 Test Requirements

**Unit Tests:**
- K-factor calculation accuracy (10 users, 15 invites, 12 FVM → K=1.2)
- Funnel rates (15 sent, 12 opened, 10 accepted, 9 FVM → 80%, 83.3%, 60%)
- Edge cases: empty data, division by zero

**Integration Tests:**
- Dashboard loads, metrics display, refresh works, error handling

**Acceptance Criteria:**
- ✅ K-factor accurate, all metrics visible, <2s load time, graceful error handling

---

## 9. Future Enhancements

**Phase 2:** Funnel charts, K-factor trends, auto-refresh (30s), Recharts integration  
**Phase 3:** Cohort retention, LTV deltas, multi-touch attribution, A/B test results, CSV/PDF export

---

## 10. Performance Considerations

**Database Optimization:**
- Indexes: `invites.created_at`, `inviter_id + created_at`, `opened_at/invitee_id/fvm_reached_at` (where not null)
- Cache results (30s client/server)
- Batch queries, limit time windows

**Future:** Redis cache, background pre-calculation, incremental updates

---

## 11. Security, Dependencies & Risks

**Access Control:** MVP: Public view. Future: Admin-only, role-based, audit logging  
**Data Privacy:** Aggregate metrics only, no PII, secure endpoints  
**Dependencies:** Invites/Users collections (Firestore), no external APIs  
**Risks:** Slow queries (mitigate: indexes, cache), calculation errors (tests, validation), misleading metrics (clear labels)

---

**Document Status:** Ready for Implementation  
**Last Updated:** 2025-01-21  
**Related Documents:** PRD_MVP.md, PRD_viral_loop.md

