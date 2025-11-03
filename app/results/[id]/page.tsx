'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { PracticeResult, ShareCard, InviteCreateResponse } from '@/types';
import { doc, getDoc } from 'firebase/firestore';

interface ShareModalProps {
  shareData: {
    shortCode: string;
    shareUrl: string;
    shareCard: ShareCard;
  };
  onClose: () => void;
}

function ShareModal({ shareData, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareData.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareData.shareUrl;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy:', fallbackErr);
      }
      document.body.removeChild(input);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Challenge Created! 🎉</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Share Your Challenge</h3>
          <p className="text-gray-700 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            {shareData.shareCard.text}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share Link:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareData.shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 truncate"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [shareData, setShareData] = useState<InviteCreateResponse | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResult() {
      if (!resultId) {
        setError('Invalid result ID');
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'practice_results', resultId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('Practice result not found');
          setLoading(false);
          return;
        }

        const data = docSnap.data();
        setResult({
          id: docSnap.id,
          user_id: data.user_id,
          score: data.score,
          skill_gaps: data.skill_gaps || [],
          completed_at: data.completed_at,
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching result:', err);
        setError('Failed to load practice result');
        setLoading(false);
      }
    }

    fetchResult();
  }, [resultId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const shouldShowInvite = result ? result.score >= 50 : false;

  // Get userId from localStorage or mock (for MVP)
  const getUserId = (): string => {
    // In MVP, use a mock user ID. In production, get from auth context
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userId');
      if (stored) return stored;
      // Default mock user for MVP
      const mockUserId = 'user_alex';
      localStorage.setItem('userId', mockUserId);
      return mockUserId;
    }
    return 'user_alex';
  };

  const handleCreateInvite = async () => {
    if (!result) return;
    
    setIsCreatingInvite(true);
    setInviteError(null);
    
    try {
      const userId = getUserId();
      const response = await fetch('/api/invite/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          resultId: result.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error types
        if (response.status === 429) {
          setInviteError('You\'ve reached your daily limit of 3 challenges. Try again tomorrow!');
        } else if (response.status === 403) {
          if (data.error === 'cooldown_period') {
            setInviteError('Please wait a bit before creating another challenge.');
          } else {
            setInviteError('You are not eligible to create a challenge at this time.');
          }
        } else if (response.status === 400 && data.error === 'score_too_low') {
          setInviteError('Score must be at least 50% to challenge friends.');
        } else {
          setInviteError(data.message || 'Something went wrong. Please try again.');
        }
        setIsCreatingInvite(false);
        return;
      }

      // Success
      setShareData(data);
      setIsCreatingInvite(false);
    } catch (err) {
      console.error('Error creating invite:', err);
      setInviteError('Failed to create challenge. Please try again.');
      setIsCreatingInvite(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Practice result not found'}</p>
          <button
            onClick={() => router.push('/practice')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Take Another Test
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8">Practice Test Results</h1>

        {/* Score Display */}
        <div className="text-center mb-8">
          <div className="mb-2 text-lg text-gray-600">Your Score</div>
          <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
            {result.score}%
          </div>
        </div>

        {/* Skill Gaps */}
        <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Areas to Improve</h2>
          {result.skill_gaps.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {result.skill_gaps.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No areas to improve 🎉</p>
          )}
        </div>

        {/* Challenge Friend Button */}
        {shouldShowInvite && (
          <div className="mb-6 text-center">
            <button
              onClick={handleCreateInvite}
              disabled={isCreatingInvite}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors relative group min-h-[44px]"
            >
              {isCreatingInvite ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Challenge a Friend'
              )}
            </button>
            {inviteError && (
              <p className="mt-2 text-sm text-red-600">{inviteError}</p>
            )}
          </div>
        )}

        {/* Share Modal */}
        {shareData && (
          <ShareModal
            shareData={shareData}
            onClose={() => setShareData(null)}
          />
        )}

        {/* Navigation */}
        <div className="text-center">
          <button
            onClick={() => router.push('/practice')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Take Another Test
          </button>
        </div>
      </div>
    </main>
  );
}
