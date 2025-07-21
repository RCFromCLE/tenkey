/**
 * Simple prompts for chatting with SEC filings
 * Focused on basic questions and exploration rather than investment analysis
 */

import type { Prompt } from '../types/filing-chat';

/**
 * Simple prompts for general filing exploration
 */
export const SIMPLE_FILING_PROMPTS = {
  'common': {
    'Basic Questions': [
      'What does this company do?',
      'What are the main products or services?',
      'Who are the main competitors?',
      'What are the biggest risks mentioned?',
      'What are the key business segments?',
      'How does the company make money?'
    ],
    'Financial Basics': [
      'What was the revenue last year?',
      'Is the company profitable?',
      'How much cash does the company have?',
      'What are the main expenses?',
      'How much debt does the company have?',
      'What are the key financial metrics?'
    ],
    'Business Understanding': [
      'What markets does the company operate in?',
      'Who are the main customers?',
      'What is the company\'s strategy?',
      'What are the growth opportunities?',
      'What challenges is the company facing?',
      'How has the business changed recently?'
    ]
  },
  '10-K': {
    'Annual Overview': [
      'Summarize the company\'s business model',
      'What were the key highlights from last year?',
      'What are the main business segments and their performance?',
      'What risks does the company face?',
      'What is the company\'s competitive position?',
      'What are the key financial results?'
    ],
    'Strategy & Operations': [
      'What is the company\'s long-term strategy?',
      'How does the company plan to grow?',
      'What investments is the company making?',
      'What are the key operational metrics?',
      'How does the company manage risk?',
      'What regulatory issues affect the business?'
    ]
  },
  '10-Q': {
    'Quarterly Results': [
      'How did the company perform this quarter?',
      'What were the key financial results?',
      'How do results compare to last quarter?',
      'What trends are emerging in the business?',
      'What did management say about the outlook?',
      'Were there any significant events this quarter?'
    ],
    'Recent Developments': [
      'What changes happened in the business recently?',
      'How are market conditions affecting the company?',
      'What new initiatives or products were launched?',
      'How is the company adapting to challenges?',
      'What guidance did management provide?',
      'What should investors watch for next quarter?'
    ]
  }
} as const;

/**
 * Function to flatten the simple prompt structure into a flat array of Prompt objects
 */
export function flattenSimplePrompts(): Prompt[] {
  const allPrompts: Prompt[] = [];
  let idCounter = 0;

  for (const type of Object.keys(SIMPLE_FILING_PROMPTS)) {
    const categories = SIMPLE_FILING_PROMPTS[type as keyof typeof SIMPLE_FILING_PROMPTS];
    for (const category in categories) {
      const prompts = (categories as any)[category];
      for (const text of prompts) {
        allPrompts.push({
          id: `simple-${type}-${idCounter++}`,
          text,
          category: category,
          filingType: type as 'common' | '10-K' | '10-Q',
        });
      }
    }
  }
  return allPrompts;
}

/**
 * Default simple prompts array
 */
export const DEFAULT_SIMPLE_PROMPTS = flattenSimplePrompts();
