import { notFound } from 'next/navigation';
import AcceptChallengeButton from './AcceptChallengeButton';
import type { InviteResolutionResponse } from '@/types';

interface PageProps {
  params: {
    shortCode: string;
  };
}

async function fetchInviteData(shortCode: string): Promise<InviteResolutionResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/invite/${shortCode}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Invite not found
      }
      throw new Error('Failed to fetch invite data');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching invite data:', error);
    return null;
  }
}

export default async function InviteLandingPage({ params }: PageProps) {
  const inviteData = await fetchInviteData(params.shortCode);

  if (!inviteData) {
    notFound(); // Shows 404 page
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {inviteData.inviter.name} challenged you! 🎯
          </h1>
          <p className="text-gray-600">
            {inviteData.callToAction}
          </p>
        </div>

        {/* Challenge Details */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Challenge Details
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subject:</span>
              <span className="font-semibold text-gray-900">
                {inviteData.challenge.skill}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Questions:</span>
              <span className="font-semibold text-gray-900">
                {inviteData.challenge.questionCount}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="font-semibold text-gray-900">
                {inviteData.challenge.estimatedTime}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">{inviteData.inviter.name}'s Score:</span>
              <span className="font-semibold text-blue-600">
                {inviteData.challenge.inviterScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Share Copy */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
          <p className="text-gray-700 italic">
            "{inviteData.challenge.shareCopy}"
          </p>
        </div>

        {/* CTA */}
        <AcceptChallengeButton
          shortCode={params.shortCode}
          inviteId={inviteData.inviteId}
        />
      </div>
    </div>
  );
}

