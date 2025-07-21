'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function ApiKeyUI() {
  const { data: session } = useSession();
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchApiKey();
    }
  }, [session]);

  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch API key');
      const data = await response.json();
      setApiKey(data.apiKey || '');
    } catch (err) {
      console.error('Error fetching API key:', err);
    }
  };

  const saveApiKey = async () => {
    setIsSaving(true);
    setError(null);
    setIsSaved(false);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (!response.ok) throw new Error('Failed to save API key');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000); // Hide message after 3 seconds
    } catch (err) {
      setError('Failed to save API key. Please try again.');
      console.error('Error saving API key:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!session) return null;

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl shadow-lg backdrop-blur-sm">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-100">Manage API Key</h3>
        <p className="text-sm text-slate-400 mt-1">
          Use any model from OpenRouter by providing your API key.
        </p>
      </div>
      
      <div className="flex flex-col gap-4">
        <input
          type="password"
          placeholder="Enter your OpenRouter API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800/70 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/80 transition-all"
        />
        <button
          onClick={saveApiKey}
          disabled={isSaving}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save API Key'}
        </button>
      </div>

      <div className="text-center mt-4">
        {isSaved && (
          <p className="text-emerald-400 text-sm">
            API key saved successfully!
          </p>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        <p className="text-xs text-slate-500 mt-3">
          Don't have a key? Get one from{' '}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline"
          >
            OpenRouter.ai
          </a>
        </p>
      </div>
    </div>
  );
}
