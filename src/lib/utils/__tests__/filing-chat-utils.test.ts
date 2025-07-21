/**
 * Unit tests for filing-chat utility functions
 */

import { 
  formatTimestamp, 
  extractFilingCitations,
  formatMessageWithAnnotations,
  isFilingTabDisabled,
  generateMessageId,
  isValidPromptText,
  filterPromptsBySearch
} from '../filing-chat-utils';
import type { Filing } from '../../types/filing';

describe('filing-chat-utils', () => {
  describe('formatTimestamp', () => {
    it('should format valid date correctly', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatTimestamp(date);
      expect(result).toMatch(/2:30 PM/);
    });

    it('should return empty string for invalid date', () => {
      const invalidDate = new Date('invalid');
      expect(formatTimestamp(invalidDate)).toBe('');
    });

    it('should return empty string for non-date input', () => {
      expect(formatTimestamp(null as any)).toBe('');
      expect(formatTimestamp(undefined as any)).toBe('');
      expect(formatTimestamp('string' as any)).toBe('');
    });
  });

  describe('extractFilingCitations', () => {
    const mockFilings: Filing[] = [
      {
        form: '10-K',
        filingDate: '2024-03-15',
        reportDate: '2024-03-15',
        accessionNumber: '123',
        primaryDocument: 'doc123.htm',
        htmlUrl: 'http://example.com',
        textUrl: 'http://example.com/text',
        content: 'content',
        companyName: 'Test Corp',
        type: '10-K',
        symbol: 'TEST'
      },
      {
        form: '10-Q',
        filingDate: '2024-06-15',
        reportDate: '2024-06-15',
        accessionNumber: '456',
        primaryDocument: 'doc456.htm',
        htmlUrl: 'http://example.com',
        textUrl: 'http://example.com/text',
        content: 'content',
        companyName: 'Test Corp',
        type: '10-Q',
        symbol: 'TEST'
      }
    ];

    it('should extract and format filing citations', () => {
      const content = 'According to the 10-K filing and latest 10-Q report...';
      const result = extractFilingCitations(content, mockFilings);
      
      expect(result.citations).toHaveLength(2);
      expect(result.citations).toContain('10-K (2024-03-15)');
      expect(result.citations).toContain('10-Q (2024-06-15)');
      expect(result.formattedContent).toContain('**10-K**');
      expect(result.formattedContent).toContain('**10-Q**');
    });

    it('should handle no citations found', () => {
      const content = 'This is a regular message without filing references.';
      const result = extractFilingCitations(content, mockFilings);
      
      expect(result.citations).toHaveLength(0);
      expect(result.formattedContent).toBe(content);
    });

    it('should not duplicate citations', () => {
      const content = 'The 10-K shows... and the 10-K also mentions...';
      const result = extractFilingCitations(content, mockFilings);
      
      expect(result.citations).toHaveLength(1);
      expect(result.citations).toContain('10-K (2024-03-15)');
    });

    it('should handle filing types not in selected filings', () => {
      const content = 'The 8-K filing shows...';
      const result = extractFilingCitations(content, mockFilings);
      
      expect(result.citations).toHaveLength(0);
      expect(result.formattedContent).toBe(content);
    });
  });

  describe('formatMessageWithAnnotations', () => {
    it('should format URL citations correctly', () => {
      const content = 'Check this source for more info.';
      const annotations = [{
        type: 'url_citation',
        url_citation: {
          url: 'https://example.com',
          title: 'Example Source',
          start_index: 6,
          end_index: 17
        }
      }];
      
      const result = formatMessageWithAnnotations(content, annotations);
      expect(result).toBe('Check [Example Source](https://example.com) for more info.');
    });

    it('should handle missing title', () => {
      const content = 'Check this source.';
      const annotations = [{
        type: 'url_citation',
        url_citation: {
          url: 'https://example.com',
          title: null,
          start_index: 6,
          end_index: 17
        }
      }];
      
      const result = formatMessageWithAnnotations(content, annotations);
      expect(result).toBe('Check [source](https://example.com).');
    });

    it('should handle no annotations', () => {
      const content = 'Regular message.';
      const result = formatMessageWithAnnotations(content);
      expect(result).toBe(content);
    });

    it('should handle empty annotations array', () => {
      const content = 'Regular message.';
      const result = formatMessageWithAnnotations(content, []);
      expect(result).toBe(content);
    });
  });

  describe('isFilingTabDisabled', () => {
    const filing10K: Filing = {
      form: '10-K',
      filingDate: '2024-03-15',
      reportDate: '2024-03-15',
      accessionNumber: '123',
      primaryDocument: 'doc123.htm',
      htmlUrl: 'http://example.com',
      textUrl: 'http://example.com/text',
      content: 'content',
      companyName: 'Test Corp',
      type: '10-K',
      symbol: 'TEST'
    };

    const filing10Q: Filing = {
      form: '10-Q',
      filingDate: '2024-06-15',
      reportDate: '2024-06-15',
      accessionNumber: '456',
      primaryDocument: 'doc456.htm',
      htmlUrl: 'http://example.com',
      textUrl: 'http://example.com/text',
      content: 'content',
      companyName: 'Test Corp',
      type: '10-Q',
      symbol: 'TEST'
    };

    it('should return false when no filings selected', () => {
      expect(isFilingTabDisabled('10-K', [])).toBe(false);
      expect(isFilingTabDisabled('10-Q', [])).toBe(false);
    });

    it('should return false when filing type exists', () => {
      expect(isFilingTabDisabled('10-K', [filing10K])).toBe(false);
      expect(isFilingTabDisabled('10-Q', [filing10Q])).toBe(false);
    });

    it('should return true when filing type does not exist', () => {
      expect(isFilingTabDisabled('10-K', [filing10Q])).toBe(true);
      expect(isFilingTabDisabled('10-Q', [filing10K])).toBe(true);
    });
  });

  describe('generateMessageId', () => {
    it('should generate unique message IDs', () => {
      const id1 = generateMessageId(0);
      const id2 = generateMessageId(1);
      const id3 = generateMessageId(100);
      
      expect(id1).toBe('message-0');
      expect(id2).toBe('message-1');
      expect(id3).toBe('message-100');
    });
  });

  describe('isValidPromptText', () => {
    it('should return true for valid text', () => {
      expect(isValidPromptText('Valid prompt')).toBe(true);
      expect(isValidPromptText('  Trimmed prompt  ')).toBe(true);
    });

    it('should return false for invalid text', () => {
      expect(isValidPromptText('')).toBe(false);
      expect(isValidPromptText('   ')).toBe(false);
      expect(isValidPromptText('\t\n')).toBe(false);
    });
  });

  describe('filterPromptsBySearch', () => {
    const prompts = [
      { id: '1', text: 'Revenue growth rate?', category: 'Financial' },
      { id: '2', text: 'Market share changes?', category: 'Business' },
      { id: '3', text: 'Risk assessment', category: 'Risk' }
    ];

    it('should filter by text content', () => {
      const result = filterPromptsBySearch(prompts, 'revenue');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter by category', () => {
      const result = filterPromptsBySearch(prompts, 'risk');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('should be case insensitive', () => {
      const result = filterPromptsBySearch(prompts, 'MARKET');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should return all prompts for empty search', () => {
      const result = filterPromptsBySearch(prompts, '');
      expect(result).toHaveLength(3);
    });
  });
});
