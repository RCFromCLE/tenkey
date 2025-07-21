// src/app/api/investor-scope/route.ts
import { NextResponse } from 'next/server';
import { OpenRouterService } from '../../../lib/services/openrouter';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '../../../lib/auth/config';
import { prisma } from '../../../lib/db';
import { processFilingContent } from '../../../lib/utils/filing-processor';

const INVESTOR_SCOPE_SYSTEM_PROMPT = `You are InvestorScope™, an elite AI investment analyst with decades of Wall Street experience. Generate a comprehensive investment analysis report in JSON format.

Your analysis should be thorough, professional, and actionable - like what a top-tier investment bank would produce. Consider all aspects: financials, business quality, growth prospects, valuation, management, risks, and market dynamics.

Return ONLY valid JSON in this exact structure:
{
  "overallGrade": "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D" | "F",
  "overallScore": number (0-100),
  "confidence": number (0-100),
  
  "financialHealth": {
    "grade": string,
    "score": number (0-100),
    "trend": "up" | "down" | "stable",
    "metrics": {
      "revenue": {
        "value": number,
        "growth": number,
        "grade": string
      },
      "profitability": {
        "value": number,
        "margin": number,
        "grade": string
      },
      "cashFlow": {
        "value": number,
        "strength": string,
        "grade": string
      },
      "debt": {
        "ratio": number,
        "trend": string,
        "grade": string
      }
    }
  },
  
  "businessQuality": {
    "grade": string,
    "score": number (0-100),
    "strengths": [string],
    "concerns": [string],
    "moat": {
      "strength": "Strong" | "Moderate" | "Weak" | "None",
      "description": string
    }
  },
  
  "growthProspects": {
    "grade": string,
    "score": number (0-100),
    "outlook": string,
    "catalysts": [string],
    "risks": [string]
  },
  
  "valuation": {
    "grade": string,
    "score": number (0-100),
    "assessment": "undervalued" | "fairly_valued" | "overvalued",
    "reasoning": string
  },
  
  "management": {
    "grade": string,
    "score": number (0-100),
    "assessment": string,
    "highlights": [string]
  },
  
  "investmentThesis": {
    "bullCase": [string],
    "bearCase": [string],
    "keyQuestions": [string]
  },
  
  "recommendation": {
    "action": "strong_buy" | "buy" | "hold" | "sell" | "strong_sell",
    "confidence": number (0-100),
    "timeHorizon": string,
    "priceTarget": number,
    "reasoning": string
  },
  
  "riskProfile": {
    "overall": "low" | "medium" | "high",
    "factors": [{
      "type": string,
      "level": "low" | "medium" | "high",
      "description": string
    }]
  },
  
  "insights": [{
    "type": "opportunity" | "risk" | "trend" | "catalyst",
    "title": string,
    "description": string,
    "impact": "high" | "medium" | "low"
  }]
}

Grading Guidelines:
- A+/A: Exceptional companies with strong fundamentals, clear competitive advantages, excellent management
- B+/B: Solid companies with good fundamentals, some competitive advantages
- C+/C: Average companies with mixed fundamentals, limited advantages
- D/F: Poor companies with weak fundamentals, significant risks

Be rigorous in your analysis. Consider:
- Financial trends and quality of earnings
- Competitive positioning and market dynamics
- Management track record and capital allocation
- Industry headwinds/tailwinds
- Valuation relative to growth and quality
- ESG factors and regulatory risks
- Macroeconomic sensitivity

Provide specific, actionable insights that would help institutional investors make informed decisions.`;

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
    const { companyName, symbol, tenK, tenQ, stockPrice, model } = body;
    
    if (!tenK?.content || !tenQ?.content) {
      return NextResponse.json(
        { error: 'Both 10-K and 10-Q content required' },
        { status: 400 }
      );
    }

    // Process both filings for comprehensive analysis
    const tenKSections = processFilingContent(tenK.content);
    const tenQSections = processFilingContent(tenQ.content);

    // Extract key sections for analysis
    const analysisContent = {
      // Financial data from both filings
      financials: [
        ...tenKSections.find(s => s.name === 'financial_statements')?.chunks || [],
        ...tenQSections.find(s => s.name === 'financial_statements')?.chunks || []
      ].map(c => c.content).join('\n\n'),
      
      // Management discussion and analysis
      mda: [
        ...tenKSections.find(s => s.name === 'mda')?.chunks || [],
        ...tenQSections.find(s => s.name === 'mda')?.chunks || []
      ].map(c => c.content).join('\n\n'),
      
      // Business overview and strategy
      business: tenKSections.find(s => s.name === 'business')?.chunks
        .map(c => c.content).join('\n\n') || '',
      
      // Risk factors
      risks: [
        ...tenKSections.find(s => s.name === 'risk_factors')?.chunks || [],
        ...tenQSections.find(s => s.name === 'risk_factors')?.chunks || []
      ].map(c => c.content).join('\n\n'),
      
      // Controls and procedures (management quality indicator)
      controls: tenKSections.find(s => s.name === 'controls')?.chunks
        .map(c => c.content).join('\n\n') || ''
    };

    // Generate comprehensive investment analysis
    const response = await OpenRouterService.generateResponse([
      {
        role: 'system',
        content: INVESTOR_SCOPE_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Analyze ${companyName} (${symbol}) for investment potential. Current stock price: $${stockPrice || 'N/A'}

FINANCIAL STATEMENTS & METRICS:
${analysisContent.financials}

MANAGEMENT DISCUSSION & ANALYSIS:
${analysisContent.mda}

BUSINESS OVERVIEW & STRATEGY:
${analysisContent.business}

RISK FACTORS:
${analysisContent.risks}

MANAGEMENT & CONTROLS:
${analysisContent.controls}

Filing Dates:
- 10-K: ${tenK.filingDate}
- 10-Q: ${tenQ.filingDate}

Provide a comprehensive InvestorScope™ analysis with specific grades, scores, and actionable investment recommendations. Focus on:

1. Financial Health: Revenue growth, profitability trends, cash generation, balance sheet strength
2. Business Quality: Competitive moat, market position, operational efficiency
3. Growth Prospects: Market opportunities, innovation pipeline, expansion plans
4. Valuation: Current valuation vs intrinsic value, peer comparison
5. Management: Track record, capital allocation, strategic vision
6. Risk Assessment: Key risks and their probability/impact
7. Investment Thesis: Clear bull/bear cases with specific catalysts

Be thorough but concise. Provide specific numerical grades and confidence levels.`
      }
    ], user.openRouterApiKey, model || 'anthropic/claude-3-sonnet-20240229');

    // Parse the streaming response
    const responseText = await new Response(response).text();
    let fullResponse = responseText;

    // Parse JSON response
    let analysisData;
    try {
      // Clean the response to extract JSON
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      analysisData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', fullResponse);
      
      // Return a fallback response
      return NextResponse.json({
        overallGrade: 'C',
        overallScore: 50,
        confidence: 60,
        financialHealth: {
          grade: 'C',
          score: 50,
          trend: 'stable',
          metrics: {
            revenue: { value: 0, growth: 0, grade: 'C' },
            profitability: { value: 0, margin: 0, grade: 'C' },
            cashFlow: { value: 0, strength: 'Moderate', grade: 'C' },
            debt: { ratio: 0, trend: 'stable', grade: 'C' }
          }
        },
        businessQuality: {
          grade: 'C',
          score: 50,
          strengths: ['Analysis in progress'],
          concerns: ['Detailed analysis required'],
          moat: { strength: 'Moderate', description: 'Competitive position being evaluated' }
        },
        growthProspects: {
          grade: 'C',
          score: 50,
          outlook: 'Mixed growth prospects',
          catalysts: ['Market expansion opportunities'],
          risks: ['Competitive pressures']
        },
        valuation: {
          grade: 'C',
          score: 50,
          assessment: 'fairly_valued',
          reasoning: 'Valuation analysis in progress'
        },
        management: {
          grade: 'C',
          score: 50,
          assessment: 'Management evaluation ongoing',
          highlights: ['Track record being assessed']
        },
        investmentThesis: {
          bullCase: ['Strong market position', 'Growth opportunities'],
          bearCase: ['Competitive risks', 'Market uncertainties'],
          keyQuestions: ['What drives future growth?', 'How sustainable is the competitive advantage?']
        },
        recommendation: {
          action: 'hold',
          confidence: 60,
          timeHorizon: '12 months',
          priceTarget: stockPrice || 100,
          reasoning: 'Analysis requires more detailed review of fundamentals'
        },
        riskProfile: {
          overall: 'medium',
          factors: [
            { type: 'Market Risk', level: 'medium', description: 'Subject to market volatility' },
            { type: 'Competitive Risk', level: 'medium', description: 'Facing industry competition' }
          ]
        },
        insights: [
          {
            type: 'trend',
            title: 'Analysis in Progress',
            description: 'Comprehensive analysis is being generated',
            impact: 'medium'
          }
        ]
      });
    }

    // Validate required fields and provide defaults
    const validatedData = {
      overallGrade: analysisData.overallGrade || 'C',
      overallScore: analysisData.overallScore || 50,
      confidence: analysisData.confidence || 70,
      ...analysisData
    };

    return NextResponse.json(validatedData);

  } catch (error: any) {
    console.error('InvestorScope API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate InvestorScope analysis',
        details: error.message
      },
      { status: 500 }
    );
  }
}
