import React from 'react';
import { ArrowDown } from 'lucide-react';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  visible: boolean;
}

/**
 * ScrollToBottomButton component that appears when user scrolls up
 * in the chat to quickly return to the bottom.
 */
export function ScrollToBottomButton({ onClick, visible }: ScrollToBottomButtonProps) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 animate-in fade-in slide-in-from-bottom-2"
      title="Scroll to bottom"
    >
      <ArrowDown className="w-5 h-5" />
    </button>
  );
}
