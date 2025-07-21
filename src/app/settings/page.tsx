'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Eye, EyeOff, Key, Cloud, Shield } from 'lucide-react';

const SettingsPage = () => {
  const { data: session } = useSession();
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [googleCredentials, setGoogleCredentials] = useState('');
  const [hasOpenRouterApiKey, setHasOpenRouterApiKey] = useState(false);
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false);
  const [hasGoogleCredentials, setHasGoogleCredentials] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGoogleCredentials, setShowGoogleCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session) return;
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setHasOpenRouterApiKey(data.hasOpenRouterApiKey || false);
          setHasOpenAIKey(data.hasOpenAIKey || false);
          setHasGoogleCredentials(data.hasGoogleCredentials || false);
          // Don't set the actual values - keep them empty for security
          setOpenRouterApiKey('');
          setOpenaiApiKey('');
          setGoogleCredentials('');
        } else {
          setError('Failed to fetch settings.');
        }
      } catch (err) {
        setError('An error occurred while fetching settings.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [session]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Only send values if they've been changed (not empty)
      const dataToSend: any = {};
      
      if (openRouterApiKey.trim()) {
        dataToSend.openRouterApiKey = openRouterApiKey.trim();
      }
      
      if (openaiApiKey.trim()) {
        dataToSend.openaiApiKey = openaiApiKey.trim();
      }
      
      if (googleCredentials.trim()) {
        try {
          // Attempt to parse and then stringify to ensure it's valid JSON
          dataToSend.googleCredentials = JSON.stringify(JSON.parse(googleCredentials));
        } catch (parseError) {
          setError('Invalid Google Cloud Credentials JSON format.');
          setIsSaving(false);
          return;
        }
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setSuccess('Settings saved successfully!');
        // Update the "has" states if new values were saved
        if (dataToSend.openRouterApiKey) setHasOpenRouterApiKey(true);
        if (dataToSend.openaiApiKey) setHasOpenAIKey(true);
        if (dataToSend.googleCredentials) setHasGoogleCredentials(true);
        // Clear the input fields after successful save
        setOpenRouterApiKey('');
        setOpenaiApiKey('');
        setGoogleCredentials('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save settings.');
      }
    } catch (err) {
      setError('An error occurred while saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0B0E14] to-[#0F1218]">
        <div className="text-center">
          <div className="text-4xl font-bold bg-gradient-to-br from-blue-400 to-cyan-600 bg-clip-text text-transparent mb-4 animate-pulse">
            01
          </div>
          <p className="text-slate-400 font-light">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0E14] to-[#0F1218] text-white antialiased pt-20">
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative container mx-auto px-6 py-24 max-w-4xl">
        <h1 className="text-5xl font-bold mb-12 text-center">
          <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            API Settings
          </span>
        </h1>
        
        {error && (
          <div className="mb-8 p-5 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-8 p-5 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-xl text-emerald-400">
            {success}
          </div>
        )}
        
        <div className="space-y-8">
          {/* OpenRouter API Key */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-cyan-600 bg-clip-text text-transparent">
                <Key className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="openRouterApiKey" className="text-xl font-semibold text-white">
                    OpenRouter API Key
                  </label>
                  {hasOpenRouterApiKey && (
                    <span className="text-sm text-emerald-400 bg-gradient-to-r from-emerald-500/20 to-green-500/20 px-4 py-1.5 rounded-lg border border-emerald-500/30 font-medium">
                      ✓ Configured
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {hasOpenRouterApiKey 
                    ? "Your API key is securely stored. Enter a new key to update it."
                    : "Required for AI chat functionality. Get your key from OpenRouter."}
                </p>
              </div>
            </div>
            
            <div className="relative">
              <input
                type={showOpenRouterKey ? "text" : "password"}
                id="openRouterApiKey"
                value={openRouterApiKey}
                onChange={(e) => setOpenRouterApiKey(e.target.value)}
                placeholder={hasOpenRouterApiKey ? "••••••••••••••••••••••••••••••••" : "Enter your OpenRouter API key"}
                className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/30 transition-all pr-14 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
              >
                {showOpenRouterKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* OpenAI API Key */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-3xl font-bold bg-gradient-to-br from-green-400 to-emerald-600 bg-clip-text text-transparent">
                <Key className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="openaiApiKey" className="text-xl font-semibold text-white">
                    OpenAI API Key
                  </label>
                  {hasOpenAIKey && (
                    <span className="text-sm text-emerald-400 bg-gradient-to-r from-emerald-500/20 to-green-500/20 px-4 py-1.5 rounded-lg border border-emerald-500/30 font-medium">
                      ✓ Configured
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {hasOpenAIKey 
                    ? "Your API key is securely stored. High-quality text-to-speech is enabled."
                    : "Optional: Required for OpenAI text-to-speech functionality. Get your key from OpenAI."}
                </p>
              </div>
            </div>
            
            <div className="relative">
              <input
                type={showOpenAIKey ? "text" : "password"}
                id="openaiApiKey"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder={hasOpenAIKey ? "••••••••••••••••••••••••••••••••" : "Enter your OpenAI API key"}
                className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/30 transition-all pr-14 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
              >
                {showOpenAIKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Google Cloud Credentials */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-3xl font-bold bg-gradient-to-br from-purple-400 to-pink-600 bg-clip-text text-transparent">
                <Cloud className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="googleCredentials" className="text-xl font-semibold text-white">
                    Google Cloud Credentials
                  </label>
                  {hasGoogleCredentials && (
                    <span className="text-sm text-emerald-400 bg-gradient-to-r from-emerald-500/20 to-green-500/20 px-4 py-1.5 rounded-lg border border-emerald-500/30 font-medium">
                      ✓ Configured
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {hasGoogleCredentials 
                    ? "Your credentials are securely stored. Voice features are enabled."
                    : "Optional: Required for text-to-speech functionality. Voice features will be disabled without this."}
                </p>
              </div>
            </div>
            
            <div className="relative">
              <textarea
                id="googleCredentials"
                rows={showGoogleCredentials ? 10 : 3}
                value={googleCredentials}
                onChange={(e) => setGoogleCredentials(e.target.value)}
                placeholder={hasGoogleCredentials 
                  ? "Your Google Cloud credentials are securely stored. Paste new credentials here to update them."
                  : "Paste your Google Cloud JSON credentials here"}
                className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/30 transition-all font-mono text-xs resize-none"
              />
              <button
                type="button"
                onClick={() => setShowGoogleCredentials(!showGoogleCredentials)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
              >
                {showGoogleCredentials ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSave}
              disabled={isSaving || (!openRouterApiKey.trim() && !openaiApiKey.trim() && !googleCredentials.trim())}
              className="px-8 py-3.5 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-slate-500 rounded-xl font-semibold transition-all disabled:cursor-not-allowed border border-white/20 hover:border-white/30 disabled:border-white/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          
          {/* Security Notice */}
          <div className="mt-12 p-6 bg-gradient-to-br from-slate-900/40 to-slate-800/20 rounded-2xl border border-white/5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Security Notice</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your API keys are encrypted and stored securely. They are never displayed after being saved. 
                  To update a key, simply enter a new value and save.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
