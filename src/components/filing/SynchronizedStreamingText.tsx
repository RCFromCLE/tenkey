import React, { useState, useEffect, useRef } from 'react';

interface SynchronizedStreamingTextProps {
  text: string;
  isStreaming: boolean;
  currentCharIndex?: number; // From synchronized TTS
  speed?: number; // Characters per second (fallback if not using TTS sync)
  className?: string;
  showCursor?: boolean;
  onComplete?: () => void;
}

export const SynchronizedStreamingText: React.FC<SynchronizedStreamingTextProps> = ({
  text,
  isStreaming,
  currentCharIndex,
  speed = 30, // Slower default for better sync
  className = '',
  showCursor = true,
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [localCharIndex, setLocalCharIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTextRef = useRef('');
  const completedRef = useRef(false);

  // Use synchronized char index if provided, otherwise use local streaming
  const effectiveCharIndex = currentCharIndex !== undefined ? currentCharIndex : localCharIndex;

  // Handle text changes and synchronization
  useEffect(() => {
    // If text changed, reset state
    if (text !== lastTextRef.current) {
      lastTextRef.current = text;
      setLocalCharIndex(0);
      completedRef.current = false;
      
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // If we have a synchronized char index (from TTS), use it directly
    if (currentCharIndex !== undefined) {
      setDisplayedText(text.slice(0, currentCharIndex));
      
      // Check if we've completed
      if (currentCharIndex >= text.length && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return;
    }

    // Otherwise, use local streaming logic
    if (isStreaming && localCharIndex < text.length) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Calculate delay with slight randomness for natural feel
      const baseDelay = 1000 / speed;
      const randomVariation = baseDelay * 0.3; // 30% variation
      
      intervalRef.current = setInterval(() => {
        setLocalCharIndex(prevIndex => {
          const newIndex = prevIndex + 1;
          
          if (newIndex >= text.length) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            if (!completedRef.current) {
              completedRef.current = true;
              onComplete?.();
            }
            return text.length;
          }
          
          return newIndex;
        });
      }, baseDelay + (Math.random() - 0.5) * randomVariation);
    }

    // If not streaming, show all text immediately
    if (!isStreaming && text) {
      setLocalCharIndex(text.length);
      setDisplayedText(text);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, isStreaming, speed, currentCharIndex, onComplete]);

  // Update displayed text based on effective char index
  useEffect(() => {
    setDisplayedText(text.slice(0, effectiveCharIndex));
  }, [effectiveCharIndex, text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Determine if we should show the cursor
  const shouldShowCursor = showCursor && 
    isStreaming && 
    effectiveCharIndex < text.length && 
    currentCharIndex === undefined; // Only show cursor for local streaming

  return (
    <span className={className}>
      {displayedText}
      {shouldShowCursor && (
        <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1 align-middle" />
      )}
    </span>
  );
};
