/**
 * Custom hook for managing filing selection and state
 */

import { useState, useCallback, useEffect, startTransition, useRef } from 'react';
import type { Filing, SECFiling } from '../types/filing';

interface UseFilingManagementReturn {
  selectedFilings: Filing[];
  availableFilings: Filing[];
  filingsLoading: boolean;
  isOperationInProgress: boolean;
  isSaving: boolean;
  showFilingSelector: boolean;
  setShowFilingSelector: (show: boolean) => void;
  addFiling: (filing: Filing) => void;
  removeFiling: (accessionNumber: string) => Promise<void>;
  addMultipleFilings: (filings: Filing[]) => void;
  removeMultipleFilings: (accessionNumbers: string[]) => void;
  loadAvailableFilings: () => void;
}

/**
 * Hook for managing filing selection, addition, and removal
 * @param symbol - Company symbol
 * @param initialFilings - Initial filings to select
 * @param chatId - Current chat ID for persistence
 * @param onChatIdChange - Callback when chat ID changes
 * @returns Object with filing state and management functions
 */
export function useFilingManagement(
  symbol: string,
  initialFilings: Filing[] = [],
  chatId?: string,
  onChatIdChange?: (chatId: string) => void
): UseFilingManagementReturn {
  // Initialize with initialFilings if provided, ensuring they have content
  const [selectedFilings, setSelectedFilings] = useState<Filing[]>(() => {
    const validFilings = initialFilings.filter(f => f.content && f.content.length > 0);
    return validFilings.length > 0 ? validFilings : initialFilings;
  });
  const [availableFilings, setAvailableFilings] = useState<Filing[]>([]);
  const [filingsLoading, setFilingsLoading] = useState(false);
  const [showFilingSelector, setShowFilingSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track if filings have been initialized from chat history
  const initializedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  /**
   * Save filings to database with debouncing
   */
  const saveFilings = useCallback(async (filings: Filing[]) => {
    if (!chatId && filings.length === 0) return;
    
    try {
      setIsSaving(true);
      
      if (!chatId && filings.length > 0) {
        // Create new chat with filings
        const response = await fetch('/api/chat/new/filings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filings,
            symbol,
            companyName: filings[0]?.companyName
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          onChatIdChange?.(data.chatId);
          console.log('Created new chat with filings:', data.chatId);
        }
      } else if (chatId) {
        // Update existing chat
        const response = await fetch(`/api/chat/${chatId}/filings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filings })
        });
        
        if (response.ok) {
          console.log('Updated filings for chat:', chatId);
        }
      }
    } catch (error) {
      console.error('Error saving filings:', error);
    } finally {
      setIsSaving(false);
    }
  }, [chatId, symbol, onChatIdChange]);

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback((filings: Filing[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveFilings(filings);
    }, 1000); // 1 second debounce
  }, [saveFilings]);

  // Load available filings when requested
  const loadAvailableFilings = useCallback(async () => {
    if (!symbol) return;
    
    setFilingsLoading(true);
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll use the initial filings as available filings
      setAvailableFilings(initialFilings);
    } catch (error) {
      console.error('Error loading available filings:', error);
    } finally {
      setFilingsLoading(false);
    }
  }, [symbol, initialFilings]);

  /**
   * Add a filing to the selection - non-blocking with startTransition
   */
  const addFiling = useCallback((filing: Filing) => {
    console.log('addFiling called with:', filing);
    console.log('Current selectedFilings before add:', selectedFilings);
    
    startTransition(() => {
      setSelectedFilings(prev => {
        console.log('setSelectedFilings callback, prev:', prev);
        // Check if filing already exists
        if (prev.some(f => f.accessionNumber === filing.accessionNumber)) {
          console.log('Filing already exists, returning prev');
          return prev;
        }
        const newFilings = [...prev, filing];
        console.log('Adding filing, new array:', newFilings);
        return newFilings;
      });
    });
  }, [selectedFilings]);

  /**
   * Remove a filing from the selection - optimized and non-blocking
   */
  const removeFiling = useCallback(async (accessionNumber: string): Promise<void> => {
    return new Promise((resolve) => {
      startTransition(() => {
        setSelectedFilings(prev => {
          // Early return if filing doesn't exist
          const index = prev.findIndex(f => f.accessionNumber === accessionNumber);
          if (index === -1) {
            resolve();
            return prev;
          }
          
          // Use slice for better performance with large arrays
          const newFilings = [...prev.slice(0, index), ...prev.slice(index + 1)];
          
          // Resolve after a short delay to show the loading state
          setTimeout(() => resolve(), 100);
          return newFilings;
        });
      });
    });
  }, []);

  /**
   * Add multiple filings to the selection - bulk operation
   */
  const addMultipleFilings = useCallback((filings: Filing[]) => {
    startTransition(() => {
      setSelectedFilings(prev => {
        const existingAccessionNumbers = new Set(prev.map(f => f.accessionNumber));
        const newFilings = filings.filter(f => !existingAccessionNumbers.has(f.accessionNumber));
        return newFilings.length > 0 ? [...prev, ...newFilings] : prev;
      });
    });
  }, []);

  /**
   * Remove multiple filings from the selection - bulk operation
   */
  const removeMultipleFilings = useCallback((accessionNumbers: string[]) => {
    startTransition(() => {
      setSelectedFilings(prev => {
        const accessionNumbersSet = new Set(accessionNumbers);
        return prev.filter(f => !accessionNumbersSet.has(f.accessionNumber));
      });
    });
  }, []);

  // Update selected filings when initial filings change
  useEffect(() => {
    if (initialFilings.length > 0 && selectedFilings.length === 0) {
      setSelectedFilings(initialFilings);
      initializedRef.current = true;
    }
  }, [symbol, initialFilings.length]); // Only re-run when symbol or initial filings count changes

  // Monitor filing changes and save to database
  useEffect(() => {
    // Skip saving on initial load or if not initialized
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    // Save filing changes with debouncing
    debouncedSave(selectedFilings);
  }, [selectedFilings, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    selectedFilings,
    availableFilings,
    filingsLoading,
    isOperationInProgress: false, // For now, individual components handle their own loading states
    isSaving,
    showFilingSelector,
    setShowFilingSelector,
    addFiling,
    removeFiling,
    addMultipleFilings,
    removeMultipleFilings,
    loadAvailableFilings
  };
}

/**
 * Helper to check if a specific filing type exists in selection
 */
export function hasFilingType(filings: Filing[], type: '10-K' | '10-Q'): boolean {
  return filings.some(f => 
    f.form?.includes(type) || f.type?.includes(type)
  );
}

/**
 * Helper to extract filing citations from message content
 */
export function getFilingCitations(content: string, selectedFilings: Filing[]): string[] {
  const citations: string[] = [];
  const citedFilings = new Set<string>();
  
  // Pattern to detect filing references
  const filingPattern = /\b(10-K|10-Q|8-K|DEF 14A|20-F|40-F|S-1|S-3|S-4|S-8|424B\d*)\b/gi;
  const matches = content.match(filingPattern);
  
  if (matches) {
    matches.forEach(match => {
      const matchingFiling = selectedFilings.find(f => 
        f.form.toUpperCase().includes(match.toUpperCase())
      );
      if (matchingFiling) {
        const citationKey = `${matchingFiling.form}_${matchingFiling.filingDate}`;
        if (!citedFilings.has(citationKey)) {
          citedFilings.add(citationKey);
          citations.push(`${matchingFiling.form} (${matchingFiling.filingDate})`);
        }
      }
    });
  }
  
  return citations;
}
