import React, { useState, useEffect, useRef } from 'react';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  speed?: number; // Characters per second
  className?: string;
}

export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  isStreaming,
  speed = 50, // Default 50 characters per second
  className = ''
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTextRef = useRef('');

  useEffect(() => {
    // If text changed (new chunk received), continue from where we left off
    if (text !== lastTextRef.current) {
      lastTextRef.current = text;
      
      // If we're streaming and have new content to show
      if (isStreaming && currentIndex < text.length) {
        // Clear any existing interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        // Calculate delay between characters for realistic typing
        const baseDelay = 1000 / speed;
        
        intervalRef.current = setInterval(() => {
          setCurrentIndex(prevIndex => {
            const newIndex = prevIndex + 1;
            
            if (newIndex >= text.length) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              return text.length;
            }
            
            return newIndex;
          });
        }, baseDelay + Math.random() * 20); // Add slight randomness for realism
      }
    }

    // If streaming stopped, show all text immediately
    if (!isStreaming && text) {
      setCurrentIndex(text.length);
      setDisplayedText(text);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, isStreaming, speed, currentIndex]);

  // Update displayed text based on current index
  useEffect(() => {
    setDisplayedText(text.slice(0, currentIndex));
  }, [currentIndex, text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <span className={className}>
      {displayedText}
      {isStreaming && currentIndex < text.length && (
        <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1 align-middle" />
      )}
    </span>
  );
};
