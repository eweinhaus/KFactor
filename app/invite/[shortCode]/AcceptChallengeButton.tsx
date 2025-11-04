'use client';

import { useState } from 'react';
import AcceptModal from './AcceptModal';

interface AcceptChallengeButtonProps {
  shortCode: string;
  inviteId: string;
}

export default function AcceptChallengeButton({ shortCode, inviteId }: AcceptChallengeButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg min-h-[44px]"
      >
        Accept Challenge 🚀
      </button>

      {showModal && (
        <AcceptModal
          shortCode={shortCode}
          inviteId={inviteId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

