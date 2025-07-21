// Advanced Message Formatter for Superior Readability
import { ResponseCleaner } from './response-cleaner';

export interface AdvancedFormattingOptions {
  enhanceStructure: boolean;
  improveReadability: boolean;
  formatFinancialData: boolean;
  addVisualHierarchy: boolean;
  optimizeForScanning: boolean;
  cleanupResponse: boolean;
  formatTables: boolean;
  highlightKeyMetrics: boolean;
}

export class AdvancedMessageFormatter {
  private static readonly DEFAULT_OPTIONS: AdvancedFormattingOptions = {
    enhanceStructure: true,
    improveReadability: true,
    formatFinancialData: true,
    addVisualHierarchy: true,
    optimizeForScanning: true,
    cleanupResponse: true,
    formatTables: true,
    highlightKeyMetrics: true
  };

  /**
   * Main formatting method that applies all enabled formatting options
   */
  static format(content: string, options: Partial<AdvancedFormattingOptions> = {}): string {
    if (!content?.trim()) return '';
    
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    let formattedContent = content;

    // First, clean any remaining HTML that might have slipped through
    formattedContent = this.cleanResidualHtml(formattedContent);

    // Skip cleanup to preserve formatting and spacing
    // if (opts.cleanupResponse) {
    //   formattedContent = ResponseCleaner.cleanResponse(formattedContent);
    // }

    // Detect content type and apply appropriate formatting
    formattedContent = this.detectAndFormatContent(formattedContent);

    // Apply structural enhancements
    if (opts.enhanceStructure) {
      formattedContent = this.enhanceStructure(formattedContent);
    }

    // Format financial data
    if (opts.formatFinancialData) {
      formattedContent = this.formatFinancialData(formattedContent);
    }

    // Add visual hierarchy
    if (opts.addVisualHierarchy) {
      formattedContent = this.addVisualHierarchy(formattedContent);
    }

    // Format tables
    if (opts.formatTables) {
      formattedContent = this.formatTables(formattedContent);
    }

    // Highlight key metrics
    if (opts.highlightKeyMetrics) {
      formattedContent = this.highlightKeyMetrics(formattedContent);
    }

    // Improve readability
    if (opts.improveReadability) {
      formattedContent = this.improveReadability(formattedContent);
    }

    // Optimize for scanning
    if (opts.optimizeForScanning) {
      formattedContent = this.optimizeForScanning(formattedContent);
    }

    return this.finalCleanup(formattedContent);
  }

  /**
   * Detect content type and apply appropriate formatting
   */
  private static detectAndFormatContent(content: string): string {
    if (this.isListContent(content)) {
      return this.formatListContent(content);
    }
    
    if (this.isTabularContent(content)) {
      return this.formatTabularContent(content);
    }
    
    if (this.isFinancialAnalysis(content)) {
      return this.formatFinancialAnalysis(content);
    }
    
    return content;
  }

  /**
   * Enhance document structure with proper headings and sections
   */
  private static enhanceStructure(content: string): string {
    let enhanced = content;

    // Convert common section indicators to proper headings
    enhanced = enhanced.replace(/^(Key Findings?|Summary|Overview|Analysis|Conclusion|Recommendations?):?\s*$/gim, '## $1\n');
    enhanced = enhanced.replace(/^(Financial Performance|Revenue|Expenses|Cash Flow|Balance Sheet):?\s*$/gim, '### $1\n');
    enhanced = enhanced.replace(/^(Q[1-4] \d{4}|FY \d{4}|Year \d{4}):?\s*$/gim, '#### $1\n');

    // Add proper spacing around sections
    enhanced = enhanced.replace(/\n(#{1,6}\s+[^\n]+)\n/g, '\n\n$1\n\n');

    return enhanced;
  }

  /**
   * Format financial data with proper currency and percentage formatting
   */
  private static formatFinancialData(content: string): string {
    let formatted = content;

    // Format large numbers with proper separators
    formatted = formatted.replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(billion|million|thousand|B|M|K)/gi, 
      (match, number, unit) => {
        const unitMap: { [key: string]: string } = {
          'billion': 'B', 'million': 'M', 'thousand': 'K', 'b': 'B', 'm': 'M', 'k': 'K'
        };
        return `**$${number}${unitMap[unit.toLowerCase()] || unit}**`;
      });

    // Format percentages
    formatted = formatted.replace(/(\d+(?:\.\d+)?)\s*%/g, '**$1%**');

    // Format standalone currency amounts
    formatted = formatted.replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, '**$$1**');

    return formatted;
  }

  /**
   * Add visual hierarchy with proper markdown formatting
   */
  private static addVisualHierarchy(content: string): string {
    let hierarchical = content;

    // Emphasize important financial terms
    const importantTerms = [
      'revenue', 'profit', 'loss', 'earnings', 'EBITDA', 'cash flow', 'debt', 'equity',
      'assets', 'liabilities', 'margin', 'growth', 'decline', 'increase', 'decrease'
    ];

    importantTerms.forEach(term => {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi');
      hierarchical = hierarchical.replace(regex, '**$1**');
    });

    // Format ratios and metrics
    hierarchical = hierarchical.replace(/\b(\w+)\s+ratio\b/gi, '**$1 Ratio**');
    hierarchical = hierarchical.replace(/\b(P\/E|ROE|ROA|ROI|EPS)\b/gi, '**$1**');

    return hierarchical;
  }

  /**
   * Format tables for better readability
   */
  private static formatTables(content: string): string {
    const lines = content.split('\n');
    const formattedLines: string[] = [];
    let inTable = false;
    let tableLines: string[] = [];

    for (const line of lines) {
      // Detect table-like content (multiple columns separated by spaces/tabs)
      const hasMultipleColumns = line.trim().split(/\s{2,}|\t/).length >= 3;
      const hasNumbers = /\d/.test(line);
      const isTableRow = hasMultipleColumns && hasNumbers;

      if (isTableRow && !inTable) {
        inTable = true;
        tableLines = [line];
      } else if (isTableRow && inTable) {
        tableLines.push(line);
      } else if (inTable && !isTableRow) {
        // End of table, convert to markdown
        if (tableLines.length >= 2) {
          formattedLines.push(...this.convertToMarkdownTable(tableLines));
        } else {
          formattedLines.push(...tableLines);
        }
        tableLines = [];
        inTable = false;
        formattedLines.push(line);
      } else {
        formattedLines.push(line);
      }
    }

    // Handle table at end of content
    if (inTable && tableLines.length >= 2) {
      formattedLines.push(...this.convertToMarkdownTable(tableLines));
    } else if (tableLines.length > 0) {
      formattedLines.push(...tableLines);
    }

    return formattedLines.join('\n');
  }

  /**
   * Convert array of table lines to markdown table format
   */
  private static convertToMarkdownTable(lines: string[]): string[] {
    if (lines.length < 2) return lines;

    const rows = lines.map(line => 
      line.trim().split(/\s{2,}|\t/).map(cell => cell.trim())
    );

    // Ensure all rows have the same number of columns
    const maxCols = Math.max(...rows.map(row => row.length));
    const normalizedRows = rows.map(row => {
      while (row.length < maxCols) row.push('');
      return row;
    });

    const markdownTable: string[] = [];
    
    // Header row
    markdownTable.push('| ' + normalizedRows[0].join(' | ') + ' |');
    
    // Separator row
    markdownTable.push('| ' + Array(maxCols).fill('---').join(' | ') + ' |');
    
    // Data rows
    for (let i = 1; i < normalizedRows.length; i++) {
      markdownTable.push('| ' + normalizedRows[i].join(' | ') + ' |');
    }

    return ['', ...markdownTable, ''];
  }

  /**
   * Highlight key financial metrics and KPIs
   */
  private static highlightKeyMetrics(content: string): string {
    let highlighted = content;

    // Highlight year-over-year changes
    highlighted = highlighted.replace(/(\d+(?:\.\d+)?%)\s+(increase|decrease|growth|decline)/gi, 
      '**$1 $2**');

    // Highlight quarterly comparisons
    highlighted = highlighted.replace(/(Q[1-4]\s+\d{4})/gi, '**$1**');

    // Highlight significant changes
    highlighted = highlighted.replace(/\b(significant|substantial|notable|dramatic)\s+(increase|decrease|growth|decline|change)/gi, 
      '**$1 $2**');

    return highlighted;
  }

  /**
   * Improve overall readability
   */
  private static improveReadability(content: string): string {
    let readable = content;

    // Add proper spacing around bullet points
    readable = readable.replace(/^(\s*[-*+])\s*/gm, '$1 ');

    // Ensure proper spacing after periods
    readable = readable.replace(/\.([A-Z])/g, '. $1');

    // Break up long paragraphs
    readable = readable.replace(/([.!?])\s+([A-Z][^.!?]*[.!?])\s+([A-Z])/g, '$1\n\n$2\n\n$3');

    return readable;
  }

  /**
   * Optimize content for easy scanning
   */
  private static optimizeForScanning(content: string): string {
    let optimized = content;

    // Add emphasis to key transition words
    const transitionWords = ['however', 'therefore', 'furthermore', 'additionally', 'consequently', 'meanwhile'];
    transitionWords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      optimized = optimized.replace(regex, '**$1**');
    });

    // Emphasize comparative language
    optimized = optimized.replace(/\b(compared to|versus|vs\.?|relative to)\b/gi, '**$1**');

    return optimized;
  }

  /**
   * Clean any residual HTML that might have slipped through
   */
  private static cleanResidualHtml(content: string): string {
    let cleaned = content;
    
    // Remove any remaining HTML tags with attributes (like span with style)
    cleaned = cleaned
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove script and style elements and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove all remaining tags (including self-closing)
      .replace(/<\/?[a-zA-Z][^>]*>/g, '')
      // Remove any orphaned brackets
      .replace(/[<>]/g, '')
      // Clean up common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '...')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec)))
      .replace(/&#x([a-fA-F0-9]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
    
    return cleaned;
  }

  /**
   * Final cleanup and formatting
   */
  private static finalCleanup(content: string): string {
    let cleaned = content;

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/[ \t]+$/gm, '');

    // Ensure proper spacing around headings
    cleaned = cleaned.replace(/\n(#{1,6}\s+[^\n]+)\n/g, '\n\n$1\n\n');

    return cleaned.trim();
  }

  /**
   * Helper methods for content detection
   */
  private static isListContent(content: string): boolean {
    const lines = content.split('\n');
    const listLines = lines.filter(line => /^\s*[-*+•]\s+/.test(line));
    return listLines.length >= 3;
  }

  private static isTabularContent(content: string): boolean {
    const lines = content.split('\n');
    const tableLines = lines.filter(line => {
      const columns = line.trim().split(/\s{2,}|\t/);
      return columns.length >= 3 && /\d/.test(line);
    });
    return tableLines.length >= 2;
  }

  private static isFinancialAnalysis(content: string): boolean {
    const financialKeywords = [
      'revenue', 'profit', 'earnings', 'cash flow', 'balance sheet',
      'income statement', 'financial performance', 'quarterly', 'annual'
    ];
    return financialKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  /**
   * Specialized formatting methods
   */
  private static formatListContent(content: string): string {
    return content.replace(/^\s*[-*+•]\s+/gm, '- ');
  }

  private static formatTabularContent(content: string): string {
    return this.formatTables(content);
  }

  private static formatFinancialAnalysis(content: string): string {
    let formatted = this.formatFinancialData(content);
    formatted = this.highlightKeyMetrics(formatted);
    return formatted;
  }

  /**
   * Create a condensed view of the content for previews
   */
  static createCondensedView(content: string, maxLength: number = 1000): string {
    if (content.length <= maxLength) return this.format(content);
    
    // Extract key sections
    const lines = content.split('\n');
    const importantLines: string[] = [];
    let currentLength = 0;

    for (const line of lines) {
      // Prioritize headings, financial data, and key metrics
      const isImportant = /^#{1,6}\s+|^\s*[-*+•]\s+|\$\d+|\d+%|revenue|profit|earnings/i.test(line);
      
      if (isImportant || currentLength < maxLength * 0.7) {
        if (currentLength + line.length <= maxLength) {
          importantLines.push(line);
          currentLength += line.length;
        } else {
          break;
        }
      }
    }

    const condensed = importantLines.join('\n');
    return this.format(condensed) + (content.length > maxLength ? '\n\n*[Content truncated for preview]*' : '');
  }
}

// Export singleton instance for backward compatibility
export const advancedMessageFormatter = AdvancedMessageFormatter;
