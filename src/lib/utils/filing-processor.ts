// src/lib/utils/filing-processor.ts
import { cleanHtml } from './filing-truncator';

interface FilingChunk {
  content: string;
  section: string;
  index: number;
}

interface ProcessedSection {
  name: string;
  chunks: FilingChunk[];
}

// Optimal chunk size for Claude-3 Sonnet (roughly 150k chars)
const CHUNK_SIZE = 150000;

// Smart text splitting that preserves context
function smartSplit(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed maxLength, start a new chunk
    if ((currentChunk + paragraph).length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }

    // Handle paragraphs longer than maxLength
    if (paragraph.length > maxLength) {
      // If we have accumulated content, save it first
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // Split long paragraph at sentence boundaries
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      let sentenceChunk = '';

      for (const sentence of sentences) {
        if ((sentenceChunk + sentence).length > maxLength && sentenceChunk.length > 0) {
          chunks.push(sentenceChunk.trim());
          sentenceChunk = '';
        }
        sentenceChunk += sentence + ' ';
      }

      if (sentenceChunk.length > 0) {
        chunks.push(sentenceChunk.trim());
      }
    } else {
      currentChunk += paragraph + '\n\n';
    }
  }

  // Add any remaining content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Extract and process specific sections
function extractSection(content: string, sectionType: string): string {
  const sectionPatterns: { [key: string]: RegExp } = {
    mda: /Item\s+7\.\s*Management's\s+Discussion\s+and\s+Analysis[^]*?(?=Item\s+[78]|$)/i,
    risk_factors: /Item\s+1A\.\s*Risk\s+Factors[^]*?(?=Item\s+[12]|$)/i,
    business: /Item\s+1\.\s*Business[^]*?(?=Item\s+[12]|$)/i,
    financial_statements: /Item\s+8\.\s*Financial\s+Statements[^]*?(?=Item\s+9|$)/i,
    financial_data: /Item\s+6\.\s*Selected\s+Financial\s+Data[^]*?(?=Item\s+7|$)/i
  };

  const pattern = sectionPatterns[sectionType];
  if (!pattern) {
    return '';
  }

  const match = content.match(pattern);
  return match ? match[0].trim() : '';
}

// Process a filing into manageable chunks while preserving context
export function processFilingContent(rawContent: string): ProcessedSection[] {
  // Clean the HTML content first
  const cleanedContent = cleanHtml(rawContent);

  // Define sections to extract
  const sections = [
    { name: 'financial_data', type: 'financial_data' },
    { name: 'financial_statements', type: 'financial_statements' },
    { name: 'mda', type: 'mda' },
    { name: 'business', type: 'business' },
    { name: 'risk_factors', type: 'risk_factors' }
  ];

  // Process each section
  return sections.map(({ name, type }) => {
    const sectionContent = extractSection(cleanedContent, type);
    if (!sectionContent) {
      return { name, chunks: [] };
    }

    // Split section into chunks
    const textChunks = smartSplit(sectionContent, CHUNK_SIZE);

    // Create filing chunks with metadata
    const chunks: FilingChunk[] = textChunks.map((content, index) => ({
      content,
      section: name,
      index
    }));

    return { name, chunks };
  });
}

// Helper to merge financial metrics from multiple chunks
export function mergeFinancialMetrics(metrics: any[]): any {
  const validMetrics = metrics.filter(m => m && typeof m === 'object');
  
  if (validMetrics.length === 0) {
    return null;
  }

  // Merge revenue data
  const revenue = {
    total: Math.max(...validMetrics.map(m => m.revenue?.total || 0)),
    growth: validMetrics[0]?.revenue?.growth || 'stable',
    segments: mergeSegments(validMetrics.map(m => m.revenue?.segments || []))
  };

  // Merge operating income data
  const operatingIncome = {
    total: Math.max(...validMetrics.map(m => m.operatingIncome?.total || 0)),
    growth: validMetrics[0]?.operatingIncome?.growth || 'stable',
    segments: mergeSegments(validMetrics.map(m => m.operatingIncome?.segments || []))
  };

  // Merge key metrics with deduplication
  const keyMetricsMap = new Map();
  validMetrics.forEach(metric => {
    (metric.keyMetrics || []).forEach((km: any) => {
      if (!km.name) return;
      const key = km.name.toLowerCase().trim();
      if (!keyMetricsMap.has(key) || !keyMetricsMap.get(key).details) {
        keyMetricsMap.set(key, km);
      }
    });
  });

  return {
    revenue,
    operatingIncome,
    keyMetrics: Array.from(keyMetricsMap.values()),
    summary: {
      financial: validMetrics[0]?.summary || '',
      segments: '',
      risks: ''
    }
  };
}

// Helper to merge risk factors from multiple chunks
export function mergeRiskFactors(risks: any[]): any {
  const validRisks = risks.filter(r => r && typeof r === 'object');
  
  if (validRisks.length === 0) {
    return {
      operationalRisks: [],
      marketRisks: [],
      emergingRisks: []
    };
  }

  // Helper to deduplicate risks by title
  function deduplicateRisks(riskList: any[]) {
    const uniqueRisks = new Map();
    riskList.forEach(risk => {
      if (!risk.title) return;
      const key = risk.title.toLowerCase().trim();
      if (!uniqueRisks.has(key) || !uniqueRisks.get(key).mitigationEfforts) {
        uniqueRisks.set(key, risk);
      }
    });
    return Array.from(uniqueRisks.values());
  }

  return {
    operationalRisks: deduplicateRisks(validRisks.flatMap(r => r.operationalRisks || [])),
    marketRisks: deduplicateRisks(validRisks.flatMap(r => r.marketRisks || [])),
    emergingRisks: deduplicateRisks(validRisks.flatMap(r => r.emergingRisks || [])),
    summary: validRisks[0]?.summary || ''
  };
}

// Helper to merge business segments from multiple chunks
export function mergeSegments(segments: any[]): any {
  const validSegments = segments.filter(s => s && typeof s === 'object');
  
  if (validSegments.length === 0) {
    return {
      mainSegments: [],
      trends: [],
      summary: ''
    };
  }

  // Deduplicate main segments
  const uniqueSegments = new Map();
  validSegments.forEach(segmentData => {
    (segmentData.mainSegments || []).forEach((segment: any) => {
      if (!segment.name) return;
      const key = segment.name.toLowerCase().trim();
      if (!uniqueSegments.has(key) || segment.highlights?.length > uniqueSegments.get(key).highlights?.length) {
        uniqueSegments.set(key, segment);
      }
    });
  });

  // Deduplicate trends
  const uniqueTrends = new Map();
  validSegments.forEach(segmentData => {
    (segmentData.trends || []).forEach((trend: any) => {
      if (!trend.name) return;
      const key = trend.name.toLowerCase().trim();
      if (!uniqueTrends.has(key) || !uniqueTrends.get(key).impact) {
        uniqueTrends.set(key, trend);
      }
    });
  });

  return {
    mainSegments: Array.from(uniqueSegments.values()),
    trends: Array.from(uniqueTrends.values()),
    summary: validSegments[0]?.summary || ''
  };
}
