// src/lib/auth/components/auth/AuthButton.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import React from 'react';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <button className="p-2 rounded-lg opacity-50 cursor-not-allowed" disabled>
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </button>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || ''}
              className="h-8 w-8 rounded-full ring-2 ring-slate-800"
            />
          )}
          <span className="hidden md:inline text-sm font-medium text-slate-200">
            {session.user?.name}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 
                   hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => signIn('azure-ad')}
      className="group flex items-center gap-2.5 px-4 py-2 text-sm font-medium bg-[#2F2F2F] hover:bg-[#404040]
                rounded-md transition-colors duration-200 border border-[#404040] hover:border-[#4F4F4F]"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 23 23" 
        className="transition-transform duration-200 group-hover:scale-105"
      >
        <path fill="#F25022" d="M1 1h10v10H1z"/>
        <path fill="#00A4EF" d="M1 12h10v10H1z"/>
        <path fill="#7FBA00" d="M12 1h10v10H12z"/>
        <path fill="#FFB900" d="M12 12h10v10H12z"/>
      </svg>
      <span className="text-slate-200 group-hover:text-white">
        Sign in with Microsoft
      </span>
    </button>
  );
}