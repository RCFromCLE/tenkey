// src/lib/utils/table-formatter.ts

/**
 * Formats markdown tables to ensure they render properly
 * Fixes common issues with LLM-generated tables
 */
export function formatMarkdownTables(content: string): string {
  // First, fix any malformed markdown tables
  let formatted = content;
  
  // More robust pattern to match markdown tables
  // This handles tables that might have irregular formatting
  const tablePattern = /(?:^|\n)((?:\|[^\n]*\|(?:\n|$))+)/gm;
  
  formatted = formatted.replace(tablePattern, (match: string, tableContent: string) => {
    const lines = tableContent.trim().split('\n').filter((line: string) => line.trim());
    if (lines.length < 2) return match;
    
    // First, normalize all lines to have consistent column count
    const columnCounts = lines.map((line: string) => {
      const cells = line.split('|').filter((cell: string, index: number, arr: string[]) => 
        index > 0 && index < arr.length - 1 || (index === 0 && cell.trim()) || (index === arr.length - 1 && cell.trim())
      );
      return cells.length;
    });
    
    const maxColumns = Math.max(...columnCounts);
    
    // Process each line
    const processedLines = lines.map((line: string, lineIndex: number) => {
      // Split by | and clean up
      let cells = line.split('|').map((cell: string) => cell.trim());
      
      // Remove empty cells at start and end
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();
      
      // Pad with empty cells if needed
      while (cells.length < maxColumns) {
        cells.push('');
      }
      
      // Ensure we don't have too many cells
      if (cells.length > maxColumns) {
        cells = cells.slice(0, maxColumns);
      }
      
      return '| ' + cells.join(' | ') + ' |';
    });
    
    // Check if we have a separator line (contains dashes)
    let separatorIndex = -1;
    processedLines.forEach((line: string, index: number) => {
      if (line.includes('---') || line.includes(':-') || line.match(/\|\s*-+\s*\|/)) {
        separatorIndex = index;
      }
    });
    
    // If no separator exists and we have at least 2 lines, add one after the first line
    if (separatorIndex === -1 && processedLines.length >= 2) {
      const separator = '|' + Array(maxColumns).fill(' --- ').join('|') + '|';
      processedLines.splice(1, 0, separator);
      separatorIndex = 1;
    }
    
    // Ensure the separator line is properly formatted
    if (separatorIndex !== -1) {
      const separatorCells = Array(maxColumns).fill(' --- ');
      processedLines[separatorIndex] = '|' + separatorCells.join('|') + '|';
    }
    
    // Add spacing around the table
    return '\n\n' + processedLines.join('\n') + '\n\n';
  });
  
  // Clean up any remaining formatting issues
  formatted = formatted
    // Fix multiple blank lines
    .replace(/\n{4,}/g, '\n\n\n')
    // Ensure no trailing spaces
    .replace(/ +$/gm, '');
  
  return formatted;
}

/**
 * Converts simple text tables (space or tab separated) to markdown tables
 */
export function convertTextToMarkdownTable(text: string): string {
  // Check if this looks like a table (has consistent columns)
  const lines = text.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return text;
  
  // More flexible separator detection
  // Look for consistent patterns of multiple spaces, tabs, or pipes
  const separatorPatterns = [
    /\s{2,}/g,  // Multiple spaces
    /\t+/g,     // Tabs
    /\s*\|\s*/g // Pipes with optional spaces
  ];
  
  let bestPattern = null;
  let bestConsistency = 0;
  
  // Find the most consistent separator pattern
  for (const pattern of separatorPatterns) {
    const columnCounts = lines.map((line: string) => {
      const matches = line.match(pattern);
      return matches ? matches.length + 1 : 1;
    });
    
    // Check consistency
    const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
    const consistency = columnCounts.filter(count => Math.abs(count - avgColumns) <= 1).length / lines.length;
    
    if (consistency > bestConsistency && avgColumns >= 2) {
      bestConsistency = consistency;
      bestPattern = pattern;
    }
  }
  
  // If no good pattern found, return original text
  if (!bestPattern || bestConsistency < 0.7) return text;
  
  // Split lines using the best pattern
  const rows = lines.map((line: string) => {
    if (bestPattern!.source.includes('|')) {
      // For pipe-separated, split by pipe
      return line.split(/\s*\|\s*/).filter((cell: string) => cell.trim());
    } else {
      // For space/tab separated, split by the pattern
      return line.split(bestPattern!).map((cell: string) => cell.trim()).filter((cell: string) => cell);
    }
  });
  
  // Ensure all rows have the same number of columns
  const maxCols = Math.max(...rows.map((row: string[]) => row.length));
  const normalizedRows = rows.map((row: string[]) => {
    while (row.length < maxCols) row.push('');
    return row.slice(0, maxCols);
  });
  
  // Build markdown table
  const markdownLines = [];
  
  // Header row
  markdownLines.push('| ' + normalizedRows[0].join(' | ') + ' |');
  
  // Separator row
  markdownLines.push('|' + Array(maxCols).fill(' --- ').join('|') + '|');
  
  // Data rows
  for (let i = 1; i < normalizedRows.length; i++) {
    markdownLines.push('| ' + normalizedRows[i].join(' | ') + ' |');
  }
  
  return '\n\n' + markdownLines.join('\n') + '\n\n';
}

/**
 * Clean up and format all tables in the content
 */
export function formatAllTables(content: string): string {
  if (!content) return '';
  
  let formatted = content;
  
  // First, handle already-formatted markdown tables that might be broken
  // This catches tables with pipes but incorrect formatting
  const brokenMarkdownPattern = /(?:^|\n)((?:[^\n]*\|[^\n]*(?:\n|$))+)/gm;
  formatted = formatted.replace(brokenMarkdownPattern, (match: string) => {
    // Check if this is actually a table (has multiple lines with pipes)
    const lines = match.trim().split('\n');
    const pipeLines = lines.filter((line: string) => line.includes('|'));
    
    if (pipeLines.length >= 2) {
      // This looks like a markdown table, format it
      return formatMarkdownTables(match);
    }
    
    return match;
  });
  
  // Then, try to detect and convert text tables
  // Look for patterns that suggest tabular data
  const textTablePatterns = [
    // Pattern 1: Lines with consistent multiple spaces
    /(?:^|\n)((?:[^\n]+\s{2,}[^\n]+(?:\n|$)){2,})/gm,
    // Pattern 2: Lines with tabs
    /(?:^|\n)((?:[^\n]+\t+[^\n]+(?:\n|$)){2,})/gm,
    // Pattern 3: Lines that look like financial data with aligned columns
    /(?:^|\n)((?:(?:[A-Za-z][^\n]*?)\s+(?:\$?[\d,]+(?:\.\d+)?%?|\w+)\s*(?:\n|$)){3,})/gm
  ];
  
  for (const pattern of textTablePatterns) {
    formatted = formatted.replace(pattern, (match: string) => {
      // Skip if already formatted as markdown table
      if (match.includes('|') && match.includes('---')) {
        return match;
      }
      
      const converted = convertTextToMarkdownTable(match.trim());
      // Only use the conversion if it actually created a table
      if (converted.includes('|') && converted !== match.trim()) {
        return converted;
      }
      
      return match;
    });
  }
  
  // Final pass to ensure all markdown tables are properly formatted
  formatted = formatMarkdownTables(formatted);
  
  // Clean up excessive newlines around tables
  formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
  
  return formatted;
}
