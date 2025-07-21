/**
 * ChatInput Component
 * Handles user input with auto-resize textarea, microphone integration, and send button
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatInputProps {
  input: string;
  loading: boolean;
  isListening: boolean;
  isSpeechRecognitionAvailable: boolean;
  companyName?: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onMicClick: () => void;
}

export function ChatInput({
  input,
  loading,
  isListening,
  isSpeechRecognitionAvailable,
  companyName,
  onInputChange,
  onSubmit,
  onMicClick
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('Enter key pressed, calling onSubmit');
      onSubmit();
    }
  }, [onSubmit]);

  const handleButtonClick = () => {
    console.log('Send button clicked', { input: input.trim(), loading });
    onSubmit();
  };

  return (
    <div className="relative flex items-center gap-3">
      {isSpeechRecognitionAvailable && (
        <button
          onClick={onMicClick}
          className={cn(
            "p-3 text-white transition-all rounded-lg",
            isListening 
              ? "bg-red-600 hover:bg-red-500 animate-pulse" 
              : "bg-slate-700 hover:bg-slate-600"
          )}
          title={isListening ? "Stop recording" : "Start recording"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      )}
      
      <textarea
        ref={inputRef}
        value={input}
        onChange={e => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "Listening..." : `Ask about ${companyName || 'the filings'}...`}
        className="flex-1 px-4 py-3 text-white transition-colors rounded-lg bg-slate-800/80 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 resize-none"
        rows={1}
        disabled={loading}
      />
      
      <button
        onClick={handleButtonClick}
        disabled={loading || !input.trim()}
        className="p-3 text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-600 disabled:cursor-not-allowed"
        title={loading ? "Processing..." : "Send message"}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
