'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { PracticeResult } from '@/types';
import { doc, getDoc } from 'firebase/firestore';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              disabled
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors relative group"
              title="Coming in Phase 5"
            >
              Challenge a Friend
            </button>
            <p className="mt-2 text-sm text-gray-500">Feature coming soon</p>
          </div>
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
