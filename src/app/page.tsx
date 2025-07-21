// src/app/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { CompanySearch } from '../components/company-search/CompanySearch';
import { PreviousChats } from '../components/chats/PreviousChats';
import { Toaster } from 'sonner';

export default function Home() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0E14] to-[#0F1218] text-white antialiased pt-20">
      <Toaster />

      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Main Content */}
      <div className="relative max-w-5xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-32">
          <div className="inline-block relative">
            <h1 className="text-8xl font-black tracking-tighter mb-6">
              <span className="bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent">
                TENKEY
              </span>
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          {!session && (
            <p className="text-xl text-slate-400 font-light tracking-wide mt-8">
              AI powered SEC filing analysis
            </p>
          )}
          {session && (
            <p className="text-xl text-slate-300 mt-8">
              Search any public company to analyze SEC filings
            </p>
          )}
        </div>

        {/* Search Section - Only show if logged in */}
        {session && (
          <div className="max-w-2xl mx-auto mb-16">
            <CompanySearch />
          </div>
        )}

        {/* Features - Only show if not logged in */}
        {!session && (
          <div className="space-y-32">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div className="group cursor-default">
                <div className="text-4xl font-bold bg-gradient-to-br from-blue-400 to-cyan-600 bg-clip-text text-transparent mb-4 group-hover:scale-105 transition-transform">
                  01
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Natural queries</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Ask about 10K and 10Q filings conversationally
                </p>
              </div>
              
              <div className="group cursor-default">
                <div className="text-4xl font-bold bg-gradient-to-br from-emerald-400 to-green-600 bg-clip-text text-transparent mb-4 group-hover:scale-105 transition-transform">
                  02
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">100+ models</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Claude, GPT4, Gemini, Grok via OpenRouter
                </p>
              </div>
              
              <div className="group cursor-default">
                <div className="text-4xl font-bold bg-gradient-to-br from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4 group-hover:scale-105 transition-transform">
                  03
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Voice synthesis</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Google Cloud TTS integration
                </p>
              </div>
            </div>
            
            {/* Get Started */}
            <div className="max-w-md mx-auto text-center space-y-10">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Get started</h2>
                
                <div className="space-y-3">
                  <a href="https://account.microsoft.com/account" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="block py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all group">
                    <span className="text-sm font-medium text-white">Microsoft account →</span>
                  </a>
                  
                  <a href="https://openrouter.ai/keys" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="block py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all group">
                    <span className="text-sm font-medium text-white">OpenRouter API key →</span>
                  </a>
                  
                  <a href="https://console.cloud.google.com" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="block py-3 px-6 bg-transparent hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg transition-all group">
                    <span className="text-sm font-medium text-white/60 group-hover:text-white/80">Google Cloud (optional) →</span>
                  </a>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-6 text-xs text-slate-500 uppercase tracking-wider">
                <span>SOC2</span>
                <span className="text-slate-700">•</span>
                <span>TYPE II</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Chats - Only show if logged in */}
        {session && (
          <div className="mt-16">
            <PreviousChats />
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="mt-32 pb-16">
        <div className="text-center text-xs text-slate-600 uppercase tracking-wider">
          © 2025 Tenkey · Corratech LLC
        </div>
      </footer>
    </div>
  );
}
