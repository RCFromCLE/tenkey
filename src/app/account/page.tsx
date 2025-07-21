'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { ApiKeyUI } from '../../components/api-key/ApiKeyUI';
import { Toaster } from 'sonner';

export default function AccountPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0E14]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0E14]">
        <p className="text-white">Please sign in to view your account settings.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center overflow-hidden">
      <Toaster />
      <div className="relative z-10 w-full max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Account Settings</h1>
        <ApiKeyUI />
      </div>
    </div>
  );
}
