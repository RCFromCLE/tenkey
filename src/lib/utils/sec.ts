// src/lib/utils/sec.ts

export function cleanFilingContent(content: string): string {
    return content
      // Remove HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Remove excess whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters
      .replace(/[^\x20-\x7E]/g, '')
      // Remove common SEC headers/footers
      .replace(/Table of Contents/gi, '')
      .replace(/Index to Financial Statements/gi, '')
      .trim();
  }
  
  type FilingSectionMap = {
    [key: string]: [string, string];
  };
  
  export function extractFilingSection(content: string, section: string): string {
    const sectionMarkers: FilingSectionMap = {
      'risk_factors': [
        'Item 1A. Risk Factors',
        'Item 2.'
      ],
      'business': [
        'Item 1. Business',
        'Item 1A.'
      ],
      'mda': [
        'Item 7. Management\'s Discussion and Analysis',
        'Item 8.'
      ],
      'financial_statements': [
        'Item 8. Financial Statements',
        'Item 9.'
      ]
    };
  
    if (!sectionMarkers[section]) {
      return '';
    }
  
    const [startMarker, endMarker] = sectionMarkers[section];
    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) return '';
  
    const endIndex = content.indexOf(endMarker, startIndex);
    if (endIndex === -1) return content.slice(startIndex);
  
    return content.slice(startIndex, endIndex).trim();
  }
  
  interface FinancialMetrics {
    revenue: number | null;
    netIncome: number | null;
    operatingIncome: number | null;
    assets: number | null;
    liabilities: number | null;
    equity: number | null;
  }
  
  export function summarizeFinancials(content: string): FinancialMetrics {
    // Extract and structure key financial data
    const metrics: FinancialMetrics = {
      revenue: extractMetric(content, 'revenue', 'sales'),
      netIncome: extractMetric(content, 'net income', 'earnings'),
      operatingIncome: extractMetric(content, 'operating income', 'operating profit'),
      assets: extractMetric(content, 'total assets'),
      liabilities: extractMetric(content, 'total liabilities'),
      equity: extractMetric(content, "stockholders' equity", "shareholders' equity")
    };
  
    return metrics;
  }
  
  function extractMetric(content: string, ...terms: string[]): number | null {
    for (const term of terms) {
      const regex = new RegExp(`${term}[^\\d]*(\\d[\\d,]*\\.?\\d*)`, 'i');
      const match = content.match(regex);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    return null;
  }
  
  export function identifyRisks(content: string): string[] {
    const riskSection = extractFilingSection(content, 'risk_factors');
    const risks: string[] = [];
  
    // Split into paragraphs and identify risk statements
    const paragraphs = riskSection.split(/\n\n+/);
    for (const paragraph of paragraphs) {
      if (paragraph.toLowerCase().includes('risk') || 
          paragraph.toLowerCase().includes('could') ||
          paragraph.toLowerCase().includes('may') ||
          paragraph.toLowerCase().includes('adverse')) {
        risks.push(paragraph.trim());
      }
    }
  
    return risks;
  }
  
  export function extractForwardLooking(content: string): string[] {
    const statements: string[] = [];
    const mdaSection = extractFilingSection(content, 'mda');
  
    // Common forward-looking phrases
    const phrases = [
      'expect',
      'anticipate',
      'believe',
      'plan',
      'intend',
      'estimate',
      'project',
      'forecast'
    ];
  
    // Split into sentences and find forward-looking statements
    const sentences = mdaSection.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (phrases.some(phrase => sentence.toLowerCase().includes(phrase))) {
        statements.push(sentence.trim());
      }
    }
  
    return statements;
  }