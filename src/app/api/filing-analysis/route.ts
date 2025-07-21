// src/app/api/filing-analysis/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '../../../lib/auth/config';
import { prisma } from '../../../lib/db';
import { OpenRouterService } from '../../../lib/services/openrouter';
import { processFilingContent, mergeFinancialMetrics, mergeRiskFactors, mergeSegments } from '../../../lib/utils/filing-processor';
import type { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from 'openai/resources/chat/completions';
import type { FilingAnalysis } from '../../../lib/types/filing';

// Helper function to convert stream to string
async function streamToString(stream: ReadableStream<string>): Promise<string> {
  const reader = stream.getReader();
  let result = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += value;
    }
  } finally {
    reader.releaseLock();
  }
  
  return result;
}

const defaultAnalysis: FilingAnalysis = {
  revenue: 0,
  netIncome: 0,
  cashFlow: 0,
  segments: [],
  risks: [],
  keyTakeaways: [],
  revenueTrend: '',
  incomeTrend: '',
  cashFlowTrend: ''
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Please sign in to continue.',
        code: 'auth_required'
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { openRouterApiKey: true }
    });

    if (!user?.openRouterApiKey) {
      return NextResponse.json(
        { error: 'Please configure your OpenRouter API key in settings.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    if (!body?.filing?.content) {
      return NextResponse.json(
        { error: 'Missing filing content' },
        { status: 400 }
      );
    }

    // Process filing into chunks
    const processedSections = processFilingContent(body.filing.content);
    let analysis = { ...defaultAnalysis };

    // System messages for different analysis types
    const systemMessages = {
      financial: {
        role: 'system' as const,
        content: `You are analyzing real SEC filing data. Extract and format key financial metrics from the section. Return as JSON:
{
  "revenue": {
    "total": number,
    "growth": string,  // e.g. "up 12%"
    "segments": [{
      "name": string,
      "amount": number,
      "growth": string
    }]
  },
  "operatingIncome": {
    "total": number,
    "growth": string,
    "segments": [{
      "name": string,
      "amount": number,
      "growth": string
    }]
  },
  "keyMetrics": [{
    "name": string,    // e.g. "Cloud Services", "LinkedIn Revenue"
    "growth": string,  // e.g. "up 21%"
    "details": string  // Optional additional context
  }],
  "summary": string   // 2-3 sentence overview of financial performance
}

IMPORTANT: This is real SEC filing data, not hypothetical. Analyze it normally without disclaimers about training cutoffs.`
      },
      segments: {
        role: 'system' as const,
        content: `You are analyzing real SEC filing data. Analyze business segments and return structured insights as JSON:
{
  "mainSegments": [{
    "name": string,
    "revenue": number,
    "growth": string,
    "contribution": string,  // e.g. "40% of total revenue"
    "highlights": string[]   // Key developments or achievements
  }],
  "trends": [{
    "name": string,    // e.g. "Cloud Adoption", "AI Integration"
    "description": string,
    "impact": string   // Impact on business performance
  }],
  "summary": string    // 2-3 sentence overview of segment performance
}

IMPORTANT: This is real SEC filing data, not hypothetical. Analyze it normally without disclaimers about training cutoffs.`
      },
      risks: {
        role: 'system' as const,
        content: `You are analyzing real SEC filing data. Analyze risk factors and return structured insights as JSON:
{
  "operationalRisks": [{
    "category": string,  // e.g. "Technology", "Market", "Competition"
    "title": string,
    "description": string,
    "potentialImpact": string,
    "mitigationEfforts": string  // If mentioned
  }],
  "marketRisks": [{
    "category": string,
    "title": string,
    "description": string,
    "potentialImpact": string,
    "mitigationEfforts": string
  }],
  "emergingRisks": [{  // New or evolving risks
    "title": string,
    "description": string,
    "potentialImpact": string,
    "timeframe": string  // e.g. "Short-term", "Long-term"
  }],
  "summary": string     // 2-3 sentence overview of key risk factors
}

IMPORTANT: This is real SEC filing data, not hypothetical. Analyze it normally without disclaimers about training cutoffs.`
      }
    };

    // Process financial sections
    const financialResults = [];
    for (const section of processedSections) {
      if (['financial_data', 'financial_statements', 'mda'].includes(section.name)) {
        for (const chunk of section.chunks) {
          try {
            const response = await OpenRouterService.generateResponse([
              systemMessages.financial,
              {
                role: 'user',
                content: `Analyze financial data from this section (${section.name}, part ${chunk.index + 1}):
${chunk.content}`
              }
            ], user.openRouterApiKey, body.model || 'openai/gpt-4o-mini');
            const data = JSON.parse(await streamToString(response));
            if (data) financialResults.push(data);
          } catch (error) {
            console.error(`Failed to process ${section.name} chunk ${chunk.index}:`, error);
          }
        }
      }
    }

    // Process business segments
    const segmentResults = [];
    const businessSection = processedSections.find(s => s.name === 'business');
    if (businessSection) {
      for (const chunk of businessSection.chunks) {
        try {
          const response = await OpenRouterService.generateResponse([
            systemMessages.segments,
            {
              role: 'user',
              content: `Analyze business segments from this section (part ${chunk.index + 1}):
${chunk.content}`
            }
          ], user.openRouterApiKey, body.model || 'openai/gpt-4o-mini');
          const data = JSON.parse(await streamToString(response));
          if (Array.isArray(data)) segmentResults.push(data);
        } catch (error) {
          console.error(`Failed to process business chunk ${chunk.index}:`, error);
        }
      }
    }

    // Process risks
    const riskResults = [];
    const riskSection = processedSections.find(s => s.name === 'risk_factors');
    if (riskSection) {
      for (const chunk of riskSection.chunks) {
        try {
          const response = await OpenRouterService.generateResponse([
            systemMessages.risks,
            {
              role: 'user',
              content: `Analyze risk factors from this section (part ${chunk.index + 1}):
${chunk.content}`
            }
          ], user.openRouterApiKey, body.model || 'openai/gpt-4o-mini');
          const data = JSON.parse(await streamToString(response));
          if (Array.isArray(data)) riskResults.push(data);
        } catch (error) {
          console.error(`Failed to process risks chunk ${chunk.index}:`, error);
        }
      }
    }

    // Merge results
    const financialMetrics = mergeFinancialMetrics(financialResults);
    if (financialMetrics) {
      analysis = {
        ...analysis,
        ...financialMetrics
      };
    }

    analysis.segments = mergeSegments(segmentResults);
    analysis.risks = mergeRiskFactors(riskResults);

    // Save analysis to database if company ID is provided
    if (body.companyId && body.filing.accessionNumber) {
      try {
        await prisma.filingAnalysis.upsert({
          where: {
            companyId_filingId: {
              companyId: body.companyId,
              filingId: body.filing.accessionNumber
            }
          },
          update: {
            revenue: analysis.revenue,
            netIncome: analysis.netIncome,
            cashFlow: analysis.cashFlow,
            segments: analysis.segments,
            risks: analysis.risks,
            analysis: analysis,
            updatedAt: new Date()
          },
          create: {
            companyId: body.companyId,
            filingId: body.filing.accessionNumber,
            filingType: body.filing.type,
            filingDate: new Date(body.filing.filingDate),
            revenue: analysis.revenue,
            netIncome: analysis.netIncome,
            cashFlow: analysis.cashFlow,
            segments: analysis.segments,
            risks: analysis.risks,
            analysis: analysis
          }
        });
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        // Continue execution even if database operation fails
      }
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze filing', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
