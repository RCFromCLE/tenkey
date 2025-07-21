// src/app/api/company-report/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '../../../lib/auth/config';
import { prisma } from '../../../lib/db';
import { OpenRouterService } from '../../../lib/services/openrouter';
import { processFilingContent } from '../../../lib/utils/filing-processor';

const REPORT_SYSTEM_PROMPT = `Generate a comprehensive company analysis report. Return as JSON:
{
  "overview": {
    "summary": string,      // 2-3 paragraphs executive summary
    "highlights": string[], // 4-6 key points
    "outlook": string      // Forward-looking analysis
  },
  "financialAnalysis": {
    "performance": {
      "revenue": {
        "current": number,
        "previous": number,
        "growth": string,
        "analysis": string
      },
      "profitability": {
        "netIncome": {
          "current": number,
          "previous": number,
          "growth": string
        },
        "margins": {
          "gross": string,
          "operating": string,
          "net": string
        },
        "analysis": string
      },
      "cashFlow": {
        "operating": number,
        "investing": number,
        "financing": number,
        "analysis": string
      }
    },
    "keyMetrics": [{
      "name": string,
      "value": string,
      "trend": string,
      "significance": string
    }],
    "summary": string
  },
  "businessAnalysis": {
    "model": string,        // Business model explanation
    "strategy": string,     // Strategic initiatives
    "competitive": {
      "strengths": string[],
      "weaknesses": string[],
      "opportunities": string[],
      "threats": string[]
    },
    "segments": [{
      "name": string,
      "contribution": string,
      "growth": string,
      "outlook": string
    }]
  },
  "riskAssessment": {
    "summary": string,
    "keyRisks": [{
      "category": string,
      "description": string,
      "potential_impact": string,
      "mitigation": string
    }],
    "riskTrends": string   // How risk landscape is evolving
  },
  "marketPosition": {
    "industry": string,    // Industry overview
    "competition": string, // Competitive landscape
    "marketShare": string, // Market position
    "trends": [{
      "name": string,
      "impact": string,
      "response": string
    }]
  },
  "recommendations": {
    "strengths": string[], // Key company strengths
    "concerns": string[],  // Areas of concern
    "opportunities": string[], // Growth opportunities
    "watchPoints": string[]   // Key metrics to monitor
  }
}`;

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
    
    if (!body?.tenK?.content || !body?.tenQ?.content) {
      return NextResponse.json(
        { error: 'Both 10-K and 10-Q content required' },
        { status: 400 }
      );
    }

    // Process both filings
    const tenKSections = processFilingContent(body.tenK.content);
    const tenQSections = processFilingContent(body.tenQ.content);

    // Combine relevant sections for analysis
    const combinedContent = {
      mda: [
        ...tenKSections.find(s => s.name === 'mda')?.chunks || [],
        ...tenQSections.find(s => s.name === 'mda')?.chunks || []
      ],
      business: tenKSections.find(s => s.name === 'business')?.chunks || [],
      risks: [
        ...tenKSections.find(s => s.name === 'risk_factors')?.chunks || [],
        ...tenQSections.find(s => s.name === 'risk_factors')?.chunks || []
      ],
      financials: [
        ...tenKSections.find(s => s.name === 'financial_statements')?.chunks || [],
        ...tenQSections.find(s => s.name === 'financial_statements')?.chunks || []
      ]
    };

    // Generate comprehensive report
    const response = await OpenRouterService.generateResponse([
      {
        role: 'system',
        content: REPORT_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Generate a comprehensive company analysis report combining data from:

Annual Report (10-K) sections:
${combinedContent.business.map(c => c.content).join('\n')}

Latest Quarterly Report (10-Q) sections:
${combinedContent.mda.map(c => c.content).join('\n')}

Financial Statements:
${combinedContent.financials.map(c => c.content).join('\n')}

Risk Factors:
${combinedContent.risks.map(c => c.content).join('\n')}

Company: ${body.companyName}
Report Date: ${new Date().toLocaleDateString()}`
      }
    ], user.openRouterApiKey, body.model || 'anthropic/claude-3-sonnet-20240229');

    const reportText = await new Response(response).text();
    const report = JSON.parse(reportText);

    return NextResponse.json({
      report,
      metadata: {
        company: body.companyName,
        generated: new Date().toISOString(),
        sources: {
          tenK: body.tenK.filingDate,
          tenQ: body.tenQ.filingDate
        }
      }
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
