/**
 * Custom hook for managing chat prompts with localStorage persistence
 */

import { useState, useCallback, useEffect } from 'react';
import type { Prompt } from '../types/filing-chat';
import { DEFAULT_PROMPTS } from '../constants/filing-prompts';
import { isValidPromptText } from '../utils/filing-chat-utils';

/**
 * Hook for managing prompts with CRUD operations and localStorage persistence
 * @param userId - The user ID for localStorage key namespacing
 * @returns Object with prompt state and management functions
 */
export function usePromptManagement(userId: string) {
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    const savedPrompts = localStorage.getItem(`prompts_${userId}`);
    return savedPrompts ? [...DEFAULT_PROMPTS, ...JSON.parse(savedPrompts)] : DEFAULT_PROMPTS;
  });

  /**
   * Save custom prompts to localStorage
   */
  const saveCustomPrompts = useCallback((customPrompts: Prompt[]) => {
    localStorage.setItem(`prompts_${userId}`, JSON.stringify(customPrompts));
  }, [userId]);

  /**
   * Add a new custom prompt
   */
  const addCustomPrompt = useCallback((text: string, category: string = 'Custom') => {
    if (!isValidPromptText(text)) return null;
    
    const newPrompt: Prompt = {
      id: `custom_${Date.now()}`,
      text: text.trim(),
      category,
      isCustom: true
    };
    
    const updatedPrompts = [...prompts, newPrompt];
    setPrompts(updatedPrompts);
    saveCustomPrompts(updatedPrompts.filter(p => p.isCustom));
    
    return newPrompt;
  }, [prompts, saveCustomPrompts]);

  /**
   * Update an existing prompt
   */
  const updatePrompt = useCallback((promptId: string, newText: string) => {
    if (!isValidPromptText(newText)) return false;
    
    const updatedPrompts = prompts.map(p => 
      p.id === promptId ? { ...p, text: newText.trim() } : p
    );
    setPrompts(updatedPrompts);
    saveCustomPrompts(updatedPrompts.filter(p => p.isCustom));
    
    return true;
  }, [prompts, saveCustomPrompts]);

  /**
   * Delete a prompt
   */
  const deletePrompt = useCallback((promptId: string) => {
    const updatedPrompts = prompts.filter(p => p.id !== promptId);
    setPrompts(updatedPrompts);
    saveCustomPrompts(updatedPrompts.filter(p => p.isCustom));
  }, [prompts, saveCustomPrompts]);

  /**
   * Toggle favorite status of a prompt
   */
  const toggleFavorite = useCallback((promptId: string) => {
    const updatedPrompts = prompts.map(p => 
      p.id === promptId ? { ...p, isFavorite: !p.isFavorite } : p
    );
    setPrompts(updatedPrompts);
    saveCustomPrompts(updatedPrompts.filter(p => p.isCustom));
  }, [prompts, saveCustomPrompts]);

  /**
   * Filter prompts by search query
   */
  const searchPrompts = useCallback((query: string): Prompt[] => {
    const lowerQuery = query.toLowerCase();
    return prompts.filter(prompt => 
      prompt.text.toLowerCase().includes(lowerQuery) ||
      prompt.category.toLowerCase().includes(lowerQuery)
    );
  }, [prompts]);

  /**
   * Filter prompts by filing type
   */
  const filterByFilingType = useCallback((
    filingType: 'All' | '10-K' | '10-Q' | 'Custom',
    searchQuery: string = ''
  ): Prompt[] => {
    let filtered = prompts;
    
    // Apply search filter first
    if (searchQuery) {
      filtered = searchPrompts(searchQuery);
    }
    
    // Then apply filing type filter
    switch (filingType) {
      case '10-K':
        return filtered.filter(p => p.filingType === '10-K' || p.filingType === 'common');
      case '10-Q':
        return filtered.filter(p => p.filingType === '10-Q' || p.filingType === 'common');
      case 'Custom':
        return filtered.filter(p => p.isCustom);
      case 'All':
      default:
        return filtered.filter(p => !p.isCustom);
    }
  }, [prompts, searchPrompts]);

  /**
   * Group prompts by category
   */
  const groupPromptsByCategory = useCallback((promptList: Prompt[]): Record<string, Prompt[]> => {
    return promptList.reduce((acc, prompt) => {
      const key = prompt.isCustom ? 'Custom Prompts' : prompt.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(prompt);
      return acc;
    }, {} as Record<string, Prompt[]>);
  }, []);

  /**
   * Get favorite prompts
   */
  const getFavoritePrompts = useCallback((): Prompt[] => {
    return prompts.filter(p => p.isFavorite);
  }, [prompts]);

  /**
   * Reset to default prompts (remove all custom prompts)
   */
  const resetToDefaults = useCallback(() => {
    setPrompts(DEFAULT_PROMPTS);
    localStorage.removeItem(`prompts_${userId}`);
  }, [userId]);

  return {
    prompts,
    addCustomPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    searchPrompts,
    filterByFilingType,
    groupPromptsByCategory,
    getFavoritePrompts,
    resetToDefaults,
  };
}
