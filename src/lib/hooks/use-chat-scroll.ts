/**
 * Custom hook for managing chat scroll behavior
 * Handles auto-scroll functionality and scroll-to-bottom button visibility
 */

import { useState, useCallback, useEffect } from 'react';
import { Message } from '../types/filing-chat';

interface UseChatScrollReturn {
  showScrollButton: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export function useChatScroll(
  containerRef: React.RefObject<HTMLDivElement>,
  messages: Message[]
): UseChatScrollReturn {
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current && isAutoScrollEnabled) {
      const container = containerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
    }
  }, [containerRef, isAutoScrollEnabled]);

  // Handle scroll position for auto-scroll toggle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setIsAutoScrollEnabled(prev => {
        if (prev !== isNearBottom) return isNearBottom;
        return prev;
      });
      setShowScrollButton(prev => {
        const newValue = !isNearBottom && messages.length > 0;
        if (prev !== newValue) return newValue;
        return prev;
      });
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, messages.length]);

  // Auto-scroll when messages change
  useEffect(() => {
    // Use a small delay to ensure the DOM is fully rendered before scrolling
    const scrollTimeout = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(scrollTimeout);
  }, [messages, scrollToBottom]);

  return {
    showScrollButton,
    scrollToBottom
  };
}
