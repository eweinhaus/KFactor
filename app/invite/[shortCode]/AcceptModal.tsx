'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AcceptChallengeResponse } from '@/types';

interface AcceptModalProps {
  shortCode: string;
  inviteId: string;
  onClose: () => void;
}

export default function AcceptModal({ shortCode, inviteId, onClose }: AcceptModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invite/${shortCode}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle errors
        if (data.error === 'already_accepted') {
          setError('This challenge has already been accepted');
        } else if (data.error === 'not_found') {
          setError('Challenge not found');
        } else {
          setError(data.message || 'Something went wrong');
        }
        setIsSubmitting(false);
        return;
      }

      // Success: Store userId and redirect
      const acceptData = data as AcceptChallengeResponse;
      localStorage.setItem('userId', acceptData.userId);

      // Redirect to challenge page (Phase 7)
      router.push(acceptData.redirectUrl);
    } catch (error) {
      console.error('Accept challenge error:', error);
      setError('Failed to accept challenge. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Start Challenge
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>

          {/* Email Input (Optional) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (optional)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors min-h-[44px]"
          >
            {isSubmitting ? 'Starting...' : 'Start Challenge 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}

