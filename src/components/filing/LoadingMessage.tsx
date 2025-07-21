import React from 'react';
import { Bot, Loader2 } from 'lucide-react';

/**
 * LoadingMessage component that displays while the AI is processing
 * a response, with animated loading indicators.
 */
export function LoadingMessage() {
  return (
    <div className="flex items-start gap-3 animate-in fade-in duration-300">
      <div className="flex-shrink-0 w-8 h-8 mt-0.5 rounded-full bg-blue-600 flex items-center justify-center">
        <div className="relative">
          <Bot className="w-4 h-4 text-white" />
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping" />
        </div>
      </div>
      <div className="px-4 py-3 rounded-lg bg-slate-800/90 border border-slate-700/50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">Processing your request...</span>
            <div className="flex gap-1">
              <div 
                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" 
                style={{ animationDelay: '0ms' }} 
              />
              <div 
                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" 
                style={{ animationDelay: '150ms' }} 
              />
              <div 
                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" 
                style={{ animationDelay: '300ms' }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
