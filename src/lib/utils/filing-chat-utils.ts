/**
 * Utility functions for the FilingChat component
 */

import type { Filing } from '../types/filing';

/**
 * Formats a timestamp into a human-readable time string
 * @param date - The date to format
 * @returns Formatted time string (e.g., "2:30 PM") or empty string if invalid
 */
export function formatTimestamp(date: Date): string {
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', { 
      hour: 'numeric', 
      minute: 'numeric', 
      hour12: true 
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Extracts filing citations from message content
 * @param content - The message content to search
 * @param selectedFilings - Array of currently selected filings
 * @returns Object containing formatted content and array of citations
 */
export function extractFilingCitations(
  content: string, 
  selectedFilings: Filing[]
): { formattedContent: string; citations: string[] } {
  const filingCitations: string[] = [];
  const citedFilings = new Set<string>();
  let formattedContent = content;
  
  // Pattern to detect filing references (e.g., "10-K", "10-Q", "8-K", etc.)
  const filingPattern = /\b(10-K|10-Q|8-K|DEF 14A|20-F|40-F|S-1|S-3|S-4|S-8|424B\d*)\b/gi;
  const matches = content.match(filingPattern);
  
  if (matches) {
    // Find which of our loaded filings match the references
    matches.forEach(match => {
      const matchingFiling = selectedFilings.find(f => 
        f.form.toUpperCase().includes(match.toUpperCase())
      );
      if (matchingFiling) {
        const citationKey = `${matchingFiling.form}_${matchingFiling.filingDate}`;
        if (!citedFilings.has(citationKey)) {
          citedFilings.add(citationKey);
          filingCitations.push(`${matchingFiling.form} (${matchingFiling.filingDate})`);
        }
      }
    });
    
    // Add citation indicators to the content
    formattedContent = formattedContent.replace(filingPattern, (match) => {
      const matchingFiling = selectedFilings.find(f => 
        f.form.toUpperCase().includes(match.toUpperCase())
      );
      if (matchingFiling) {
        return `**${match}**`;
      }
      return match;
    });
  }
  
  return { formattedContent, citations: filingCitations };
}

/**
 * Formats message content with URL citations from annotations
 * @param content - The original message content
 * @param annotations - Array of message annotations
 * @returns Formatted content with markdown links
 */
export function formatMessageWithAnnotations(
  content: string, 
  annotations?: any[]
): string {
  if (!annotations || annotations.length === 0) {
    return content;
  }
  
  let formattedContent = content;
  
  annotations.forEach(annotation => {
    if (annotation.type === 'url_citation') {
      const { url, title, start_index, end_index } = annotation.url_citation;
      const originalText = content.substring(start_index, end_index);
      formattedContent = formattedContent.replace(
        originalText, 
        `[${title || 'source'}](${url})`
      );
    }
  });
  
  return formattedContent;
}

/**
 * Determines if a filing type tab should be disabled
 * @param tabType - The tab type ('10-K' or '10-Q')
 * @param selectedFilings - Array of currently selected filings
 * @returns Whether the tab should be disabled
 */
export function isFilingTabDisabled(
  tabType: '10-K' | '10-Q', 
  selectedFilings: Filing[]
): boolean {
  if (selectedFilings.length === 0) return false;
  
  const hasFilingType = selectedFilings.some(f => 
    f.form?.includes(tabType) || f.type?.includes(tabType)
  );
  
  return !hasFilingType;
}

/**
 * Generates a unique message ID for TTS tracking
 * @param index - The message index
 * @returns Unique message ID string
 */
export function generateMessageId(index: number): string {
  return `message-${index}`;
}

/**
 * Validates if a prompt text is valid for saving
 * @param text - The prompt text to validate
 * @returns Whether the prompt is valid
 */
export function isValidPromptText(text: string): boolean {
  return text.trim().length > 0;
}

/**
 * Filters prompts based on search query
 * @param prompts - Array of prompts to filter
 * @param searchQuery - The search query
 * @returns Filtered array of prompts
 */
export function filterPromptsBySearch(
  prompts: any[], 
  searchQuery: string
): any[] {
  const query = searchQuery.toLowerCase();
  return prompts.filter(prompt => 
    prompt.text.toLowerCase().includes(query) ||
    prompt.category.toLowerCase().includes(query)
  );
}
