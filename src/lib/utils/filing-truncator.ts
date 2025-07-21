// src/lib/utils/filing-truncator.ts

interface PageMarker {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}

// Clean HTML while preserving structure and formatting
export function cleanHtml(text: string, preservePageMarkers = false): string {
  // First, extract page markers if needed
  const pageMarkers: PageMarker[] = [];
  let processedText = text;
  
  if (preservePageMarkers) {
    // Look for common page number patterns
    const pagePatterns = [
      /Page\s+(\d+)/gi,
      /\[Page\s+(\d+)\]/gi,
      /<page>(\d+)<\/page>/gi,
      /^\s*(\d+)\s*$/gm // Standalone numbers on their own line
    ];
    
    pagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        pageMarkers.push({
          pageNumber: parseInt(match[1]),
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });
  }
  
  // First pass: Handle tables properly - convert to markdown tables
  processedText = processedText
    .replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (tableMatch) => {
      // Extract rows
      const rows = tableMatch.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
      if (rows.length === 0) return '';
      
      let markdownTable = '\n\n';
      let headerSeparator = '';
      let hasHeader = false;
      
      rows.forEach((row, index) => {
        // Extract cells (th or td)
        const cells = row.match(/<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi) || [];
        
        if (cells.length > 0) {
          const cellContents = cells.map(cell => {
            // Clean the cell content
            return cell
              .replace(/<(th|td)[^>]*>/gi, '')
              .replace(/<\/(th|td)>/gi, '')
              .replace(/<[^>]+>/g, '') // Remove any remaining HTML
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
          });
          
          // Build the row
          markdownTable += '| ' + cellContents.join(' | ') + ' |\n';
          
          // If this is the first row and contains th tags, treat it as header
          if (index === 0 && row.includes('<th')) {
            hasHeader = true;
            // Create separator row with proper alignment
            headerSeparator = '|' + cellContents.map(() => ' --- ').join('|') + '|\n';
            markdownTable += headerSeparator;
          } else if (index === 0 && !hasHeader) {
            // If first row but no th tags, still add a separator for better formatting
            headerSeparator = '|' + cellContents.map(() => ' --- ').join('|') + '|\n';
            markdownTable += headerSeparator;
          }
        }
      });
      
      return markdownTable + '\n';
    });
  
  // Second pass: Convert common HTML elements to text equivalents
  processedText = processedText
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<h1[^>]*>/gi, '\n\n# ')
    .replace(/<h2[^>]*>/gi, '\n\n## ')
    .replace(/<h3[^>]*>/gi, '\n\n### ')
    .replace(/<h4[^>]*>/gi, '\n\n#### ')
    .replace(/<h5[^>]*>/gi, '\n\n##### ')
    .replace(/<h6[^>]*>/gi, '\n\n###### ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<blockquote[^>]*>/gi, '\n> ')
    .replace(/<\/blockquote>/gi, '\n')
    .replace(/<strong[^>]*>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<b[^>]*>/gi, '**')
    .replace(/<\/b>/gi, '**')
    .replace(/<em[^>]*>/gi, '*')
    .replace(/<\/em>/gi, '*')
    .replace(/<i[^>]*>/gi, '*')
    .replace(/<\/i>/gi, '*')
    .replace(/<code[^>]*>/gi, '`')
    .replace(/<\/code>/gi, '`')
    .replace(/<pre[^>]*>/gi, '\n```\n')
    .replace(/<\/pre>/gi, '\n```\n');
  
  // Third pass: Remove all remaining HTML tags (including complex ones)
  // This regex is more aggressive and handles tags with attributes better
  processedText = processedText
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove script and style elements and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove all remaining tags (including self-closing)
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    // Remove any orphaned closing brackets
    .replace(/>/g, '')
    // Remove any orphaned opening brackets
    .replace(/</g, '');
  
  // Fourth pass: Clean up HTML entities
  processedText = processedText
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
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([a-fA-F0-9]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // Fifth pass: Clean up whitespace and formatting
  processedText = processedText
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive whitespace
    .replace(/[ \t]+/g, ' ')
    // Remove trailing whitespace on each line
    .replace(/[ \t]+$/gm, '')
    // Remove leading whitespace on each line (except for intentional indentation)
    .replace(/^[ \t]+/gm, '')
    // Collapse multiple blank lines into maximum of two
    .replace(/\n{3,}/g, '\n\n')
    // Remove Table of Contents markers
    .replace(/Table of Contents/gi, '')
    // Trim the entire string
    .trim();
    
  return processedText;
}

// Extract sections from filing content with page tracking
export function extractFilingSections(content: string) {
  const cleanedContent = cleanHtml(content, true);
  
  // Split content into sections based on Item headers
  const sections = cleanedContent.split(/(?=Item \d+[A-Z]?\.)/g);
  
  // Track approximate page numbers based on content length
  const avgCharsPerPage = 3000; // Approximate characters per page
  let currentCharCount = 0;
  
  // Process each section
  return sections.map(section => {
    const lines = section.split('\n');
    const title = lines[0]?.trim() || 'Unknown Section';
    const content = lines.slice(1).join('\n').trim();
    
    // Calculate approximate page range
    const startPage = Math.floor(currentCharCount / avgCharsPerPage) + 1;
    currentCharCount += section.length;
    const endPage = Math.floor(currentCharCount / avgCharsPerPage) + 1;
    
    return {
      title,
      content,
      metadata: {
        formType: content.match(/Form (?:10-[KQ]|8-K)/i)?.[0] || '',
        date: content.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/)?.[0] || '',
        pageRange: startPage === endPage ? `p. ${startPage}` : `pp. ${startPage}-${endPage}`
      }
    };
  }).filter(section => section.content.length > 0);
}

// Clean and format filing content with smart truncation
export function truncateFilingContent(content: string, maxLength: number = 50000): string {
  const cleaned = cleanHtml(content);
  
  // If content is within limits, return as is
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Smart truncation - try to keep important sections
  const importantSections = [
    /Item 1A[\.\s]*Risk Factors/i,
    /Item 2[\.\s]*Management['']s Discussion/i,
    /Item 7[\.\s]*Management['']s Discussion/i,
    /Item 8[\.\s]*Financial Statements/i,
    /Business Overview/i,
    /Executive Summary/i,
    /Results of Operations/i,
    /Financial Condition/i
  ];
  
  let truncatedContent = '';
  let remainingLength = maxLength;
  
  // First, try to extract important sections
  for (const pattern of importantSections) {
    const match = cleaned.match(new RegExp(`(${pattern.source}[\\s\\S]{0,10000})`, 'i'));
    if (match && remainingLength > 0) {
      const section = match[0].substring(0, remainingLength);
      truncatedContent += '\n\n' + section;
      remainingLength -= section.length;
    }
  }
  
  // If we still have room, add the beginning of the document
  if (remainingLength > 5000 && truncatedContent.length < maxLength / 2) {
    truncatedContent = cleaned.substring(0, remainingLength) + truncatedContent;
  }
  
  // If no important sections found, just truncate from the beginning
  if (truncatedContent.length < 1000) {
    truncatedContent = cleaned.substring(0, maxLength);
  }
  
  return truncatedContent.trim() + '\n\n[Content truncated for processing]';
}

// Extract page reference from a text snippet
export function extractPageReference(content: string, snippet: string): string | null {
  // Find the snippet in the content
  const index = content.indexOf(snippet);
  if (index === -1) return null;
  
  // Calculate approximate page number
  const avgCharsPerPage = 3000;
  const pageNumber = Math.floor(index / avgCharsPerPage) + 1;
  
  return `p. ${pageNumber}`;
}
