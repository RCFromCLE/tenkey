// Enhanced Message Formatter for Improved Readability
import type { FormattingOptions } from './message-formatter';

export class EnhancedMessageFormatter {
  /**
   * Apply comprehensive formatting for maximum readability
   */
  static format(content: string, options: Partial<FormattingOptions> = {}): string {
    const defaultOptions: FormattingOptions = {
      enhanceReadability: true,
      formatFinancialData: true,
      addVisualStructure: true,
      improveScanning: true,
      humanizeLanguage: true,
      addEmojis: false,
      ...options
    };

    let formatted = content;

    // Apply formatting in specific order for best results
    if (defaultOptions.humanizeLanguage) {
      formatted = this.humanizeLanguage(formatted);
    }

    if (defaultOptions.formatFinancialData) {
      formatted = this.formatFinancialData(formatted);
    }

    if (defaultOptions.addVisualStructure) {
      formatted = this.addVisualStructure(formatted);
    }

    if (defaultOptions.enhanceReadability) {
      formatted = this.enhanceReadability(formatted);
    }

    if (defaultOptions.improveScanning) {
      formatted = this.improveScanning(formatted);
    }

    // Clean up final formatting
    formatted = this.cleanupFormatting(formatted);

    return formatted;
  }

  /**
   * Make language more conversational and less robotic
   */
  private static humanizeLanguage(content: string): string {
    return content
      // Remove overly formal phrases
      .replace(/Based on the (?:filings?|data|analysis)/gi, 'Looking at the numbers')
      .replace(/According to the (?:filings?|documents?|data)/gi, 'The data shows')
      .replace(/The filing indicates/gi, 'We can see')
      .replace(/It is worth noting that/gi, 'Interestingly,')
      .replace(/Furthermore,/gi, 'Also,')
      .replace(/Additionally,/gi, 'Plus,')
      .replace(/In conclusion,/gi, 'So overall,')
      .replace(/To summarize,/gi, 'In short,')
      .replace(/However,/g, 'But')
      .replace(/Nevertheless,/g, 'Still,')
      .replace(/Consequently,/g, 'So')
      .replace(/Therefore,/g, 'So')
      .replace(/compared to/gi, 'versus')
      .replace(/in comparison with/gi, 'compared to')
      .replace(/relative to/gi, 'versus')
      .replace(/e\.g\./gi, 'for example')
      .replace(/i\.e\./gi, 'that is');
  }

  /**
   * Format financial data with visual emphasis and clarity
   */
  private static formatFinancialData(content: string): string {
    return content
      // Format large numbers with proper notation
      .replace(/\$(\d{1,3})(\d{3})(\d{3})(\d{3})\b/g, '$$$1.$2B')
      .replace(/\$(\d{1,3})(\d{3})(\d{3})\b/g, '$$$1.$2M')
      .replace(/\$(\d{1,3})(\d{3})\b/g, '$$$1K')
      
      // Bold monetary amounts with better formatting
      .replace(/(\$[\d,]+(?:\.\d{1,2})?(?:\s*(?:billion|million|thousand|B|M|K))?)/gi, '**$1**')
      
      // Format percentages with visual indicators
      .replace(/([\+]?\d+(?:\.\d+)?%)/g, (match) => {
        const value = parseFloat(match);
        if (value > 0) return `**${match}**`;
        return `**${match}**`;
      })
      .replace(/([\-]\d+(?:\.\d+)?%)/g, '**$1**')
      
      // Format key metrics
      .replace(/(Revenue|Earnings|Profit|Margin|Growth|EPS|P\/E|ROE|ROA|EBITDA):\s*([\$\d.,%-]+)/gi, 
        '\n**$1:** $2')
      
      // Format dates more naturally
      .replace(/(\d{4})-(\d{2})-(\d{2})/g, (match, year, month, day) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
      })
      
      // Format quarters
      .replace(/Q(\d)\s+(\d{4})/g, '**Q$1 $2**');
  }

  /**
   * Add clear visual structure with sections and breaks
   */
  private static addVisualStructure(content: string): string {
    return content
      // Main section headers
      .replace(/^#\s+(.+)$/gm, '\n---\n\n# $1\n')
      .replace(/\n(Executive Summary|Financial Overview|Key Highlights|Performance Analysis|Risk Assessment|Recommendations?):/gi, 
        '\n\n---\n\n## $1:\n')
      
      // Subsection headers
      .replace(/\n(Revenue Analysis|Profitability|Cash Flow|Balance Sheet|Market Position|Competition|Growth Drivers?):/gi, 
        '\n\n### $1:\n')
      
      // Quarter/Period headers
      .replace(/\n(Q[1-4]\s+\d{4}|FY\s+\d{4}|YTD\s+\d{4})([^:]*:)/g, '\n\n### $1$2\n')
      
      // Key points and takeaways
      .replace(/\n(Key\s+(?:Takeaway|Point|Insight|Finding)s?):\s*/gi, '\n\n> **$1:**\n> ')
      .replace(/\n(Important|Notable|Significant):\s*/gi, '\n\n> **$1:**\n> ')
      
      // Lists with better formatting
      .replace(/\n[-•]\s+/g, '\n\n• ')
      .replace(/\n(\d+)\.\s+/g, '\n\n**$1.** ');
  }

  /**
   * Enhance readability with better spacing and flow
   */
  private static enhanceReadability(content: string): string {
    return content
      // Add paragraph breaks after sentences for better flow
      .replace(/\.(\s+)([A-Z])/g, '.$1\n$2')
      
      // Break up very long paragraphs
      .replace(/([^.]{200,}?)\.(\s*)/g, '$1.\n\n')
      
      // Add spacing around important elements
      .replace(/(\n)(Revenue|Profit|Growth|Margin|Cash Flow)(\s)/gi, '\n\n$2$3')
      
      // Format bullet points with proper spacing
      .replace(/\n•\s+([^\n]+)(?=\n•)/g, '\n• $1\n')
      
      // Add emphasis to comparison words
      .replace(/\b(increased?|decreased?|grew|declined?|improved?|deteriorated?)\b/gi, '**$1**')
      .replace(/\b(up|down|higher|lower|better|worse)\s+(\d+(?:\.\d+)?%?)/gi, '**$1 $2**');
  }

  /**
   * Improve scanning with visual cues and emphasis
   */
  private static improveScanning(content: string): string {
    return content
      // Create summary boxes for key information
      .replace(/Summary:\s*([^\n]+)/gi, '\n\n**SUMMARY**\n> $1\n')
      
      // Highlight positive indicators - using markdown instead of HTML
      .replace(/\b(growth|increase|improvement|gain|positive|strong|outperform\w*)\b/gi, 
        '**$1**')
      
      // Highlight negative indicators - using markdown instead of HTML
      .replace(/\b(decline|decrease|loss|negative|weak|underperform\w*|risk)\b/gi, 
        '**$1**')
      
      // Format key metrics in a scannable way
      .replace(/\b(Revenue|Earnings|EPS|Margin|ROE|ROA|P\/E):\s*([^\n,]+)/gi, 
        '\n**$1:** `$2`')
      
      // Add visual separators for major sections
      .replace(/\n(#{2,3})\s+/g, '\n\n$1 ');
  }

  /**
   * Clean up formatting for final output
   */
  private static cleanupFormatting(content: string): string {
    return content
      // Remove excessive line breaks
      .replace(/\n{4,}/g, '\n\n\n')
      .replace(/\n{3}(?=[^#])/g, '\n\n')
      
      // Clean up spacing around headers
      .replace(/\n+(?=#)/g, '\n\n')
      .replace(/(#{1,3}[^\n]+)\n{3,}/g, '$1\n\n')
      
      // Fix list formatting
      .replace(/\n\n+•/g, '\n•')
      .replace(/•\s+/g, '• ')
      
      // Clean up blockquotes
      .replace(/>\s+>\s+/g, '> ')
      .replace(/\n>\s*\n>/g, '\n>\n>')
      
      // Ensure proper spacing at start and end
      .trim();
  }

  /**
   * Format content specifically for speech synthesis
   */
  static formatForSpeech(content: string): string {
    return content
      // Remove markdown formatting but preserve numbers and financial symbols
      .replace(/[*_`~#|]/g, '')
      // Remove emojis
      .replace(/[📄📈📉💰💡📅🔑⚠️📋✅]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Create a condensed summary view for long messages
   */
  static createSummaryView(content: string): string {
    const sections = content.split(/\n#{1,3}\s+/);
    
    if (sections.length <= 1) return content;
    
    let summary = '📄 **Quick Summary**\n\n';
    
    sections.forEach((section, index) => {
      if (index === 0 && !section.trim()) return;
      
      const lines = section.split('\n');
      const header = index === 0 ? 'Overview' : lines[0];
      const firstParagraph = lines.slice(1).find(line => line.trim().length > 20);
      
      if (header && firstParagraph) {
        summary += `**${header}**\n${firstParagraph.substring(0, 150)}...\n\n`;
      }
    });
    
    return summary + '\n---\n\n' + content;
  }

  /**
   * Format content specifically for PDF export
   */
  static formatForPDF(content: string): string {
    return content
      // Remove emoji indicators for cleaner PDF
      .replace(/[📊📈📉💰💡📅🔑⚠️📋✅]/g, '')
      
      // Clean up for print
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
