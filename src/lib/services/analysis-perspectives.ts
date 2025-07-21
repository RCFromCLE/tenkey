// Analysis Perspectives for Financial Data
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface AnalysisPerspective {
  id: string;
  label: string;
  description: string;
  approach: string;
  systemPrompt: string;
  color: string;
  bgColor: string;
  borderColor: string;
  analysisStyle: {
    tone: string;
    focus: string[];
    keywords: string[];
  };
}

export const ANALYSIS_PERSPECTIVES: Record<string, AnalysisPerspective> = {
  optimistic: {
    id: 'optimistic',
    label: 'Optimistic Analysis',
    description: 'Focuses on growth opportunities and positive trends',
    approach: 'Growth-focused, opportunity-seeking analysis',
    systemPrompt: `You are providing an optimistic financial analysis that specializes in identifying growth opportunities, positive trends, and bullish indicators. Your analysis should:
- Highlight positive financial metrics and improvements
- Identify growth catalysts and expansion opportunities
- Focus on competitive advantages and market leadership
- Emphasize strong management execution and strategic wins
- Point out favorable industry trends and tailwinds
- Be enthusiastic but data-driven in your analysis
- Use confident, upbeat language while remaining professional
- Always back up optimism with specific numbers and facts`,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-700/30',
    analysisStyle: {
      tone: 'optimistic and energetic',
      focus: ['growth', 'opportunities', 'strengths', 'catalysts'],
      keywords: ['impressive', 'strong', 'accelerating', 'outperforming', 'breakthrough', 'momentum']
    }
  },
  
  cautious: {
    id: 'cautious',
    label: 'Risk-Focused Analysis',
    description: 'Identifies risks, challenges, and potential downsides',
    approach: 'Risk-aware, conservative analysis',
    systemPrompt: `You are providing a cautious financial analysis that specializes in identifying risks, challenges, and potential downsides. Your analysis should:
- Highlight concerning financial metrics and deteriorating trends
- Identify business risks and competitive threats
- Focus on weaknesses and operational challenges
- Point out management missteps and strategic concerns
- Emphasize unfavorable industry headwinds
- Be critical but fair in your assessment
- Use cautious, measured language
- Always support concerns with specific data and evidence`,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-700/30',
    analysisStyle: {
      tone: 'cautious and critical',
      focus: ['risks', 'challenges', 'weaknesses', 'threats'],
      keywords: ['concerning', 'weak', 'declining', 'underperforming', 'challenging', 'pressure']
    }
  },
  
  critical: {
    id: 'critical',
    label: 'Critical Review',
    description: 'Questions assumptions and challenges narratives',
    approach: 'Questioning, analytical review',
    systemPrompt: `You are providing a critical analysis that questions conventional wisdom and challenges management narratives. Your analysis should:
- Question management's claims and guidance
- Look for inconsistencies in financial reporting
- Challenge growth assumptions and projections
- Identify potential accounting red flags
- Compare claims against industry benchmarks
- Point out what's NOT being said in filings
- Use probing, questioning language
- Always ask "But what if..." and "Why should we believe..."
- Demand evidence and scrutinize optimistic projections`,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-700/30',
    analysisStyle: {
      tone: 'questioning and probing',
      focus: ['inconsistencies', 'assumptions', 'red flags', 'hidden risks'],
      keywords: ['questionable', 'unclear', 'suspicious', 'overstated', 'unrealistic', 'dubious']
    }
  },
  
  balanced: {
    id: 'balanced',
    label: 'Balanced Overview',
    description: 'Provides objective analysis weighing both positives and negatives',
    approach: 'Objective, comprehensive analysis',
    systemPrompt: `You are providing a balanced and objective financial analysis. Your analysis should:
- Present both opportunities and risks equally
- Weigh positive and negative factors objectively
- Provide context for all metrics and trends
- Compare performance to industry peers
- Offer nuanced, multi-faceted perspectives
- Avoid extreme positions either way
- Use neutral, professional language
- Always present "on one hand... on the other hand" analysis
- Focus on helping investors make informed decisions`,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-700/30',
    analysisStyle: {
      tone: 'neutral and professional',
      focus: ['balance', 'context', 'comparison', 'objectivity'],
      keywords: ['however', 'while', 'although', 'balanced against', 'considering both', 'mixed']
    }
  },
  
  quantitative: {
    id: 'quantitative',
    label: 'Quantitative Analysis',
    description: 'Deep dives into financial metrics, ratios, and calculations',
    approach: 'Data-driven, metrics-focused analysis',
    systemPrompt: `You are providing a quantitative financial analysis specializing in metrics and calculations. Your analysis should:
- Calculate and analyze key financial ratios
- Identify trends in margins, returns, and efficiency metrics
- Compare metrics to historical performance
- Benchmark against industry standards
- Focus on cash flow quality and sustainability
- Analyze working capital and capital allocation
- Use precise, technical language
- Always include specific calculations and formulas
- Provide data tables and metric comparisons when relevant`,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-700/30',
    analysisStyle: {
      tone: 'technical and precise',
      focus: ['metrics', 'ratios', 'trends', 'calculations'],
      keywords: ['ratio', 'margin', 'return', 'efficiency', 'correlation', 'variance']
    }
  },
  
  strategic: {
    id: 'strategic',
    label: 'Strategic Context',
    description: 'Analyzes within broader economic and industry trends',
    approach: 'Big-picture, strategic analysis',
    systemPrompt: `You are providing a strategic analysis within broader economic and industry contexts. Your analysis should:
- Connect company performance to macroeconomic trends
- Analyze industry dynamics and competitive positioning
- Identify secular trends affecting the business
- Consider geopolitical and regulatory impacts
- Evaluate market cycles and timing
- Focus on long-term strategic positioning
- Use strategic, forward-looking language
- Always connect micro to macro factors
- Consider global trends and cross-industry impacts`,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/20',
    borderColor: 'border-cyan-700/30',
    analysisStyle: {
      tone: 'strategic and visionary',
      focus: ['trends', 'positioning', 'cycles', 'disruption'],
      keywords: ['secular', 'strategic', 'positioning', 'transformation', 'paradigm', 'ecosystem']
    }
  },
  
  risk_assessment: {
    id: 'risk_assessment',
    label: 'Risk Assessment',
    description: 'Comprehensive risk evaluation and downside protection',
    approach: 'Risk-focused, protective analysis',
    systemPrompt: `You are providing a comprehensive risk assessment specializing in downside protection. Your analysis should:
- Identify and quantify all types of business risks
- Analyze worst-case scenarios and stress tests
- Evaluate balance sheet strength and liquidity
- Assess operational and execution risks
- Consider regulatory and compliance risks
- Focus on capital preservation strategies
- Use risk-focused, protective language
- Always quantify potential downside impacts
- Recommend risk mitigation strategies`,
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-700/30',
    analysisStyle: {
      tone: 'protective and cautious',
      focus: ['risks', 'downside', 'protection', 'scenarios'],
      keywords: ['exposure', 'vulnerability', 'mitigation', 'hedge', 'downside', 'protection']
    }
  },
  
  growth_focused: {
    id: 'growth_focused',
    label: 'Growth Potential',
    description: 'Hunts for explosive growth and expansion opportunities',
    approach: 'Growth-hunting, opportunity-focused analysis',
    systemPrompt: `You are providing a growth-focused analysis hunting for expansion opportunities. Your analysis should:
- Identify revenue acceleration and market share gains
- Analyze TAM (Total Addressable Market) expansion
- Focus on innovation and new product potential
- Evaluate scalability and operating leverage
- Look for network effects and competitive moats
- Emphasize reinvestment opportunities
- Use exciting, forward-looking language
- Always project future growth scenarios
- Focus on long-term compounding potential`,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-900/20',
    borderColor: 'border-indigo-700/30',
    analysisStyle: {
      tone: 'exciting and visionary',
      focus: ['growth', 'expansion', 'innovation', 'disruption'],
      keywords: ['explosive', 'accelerating', 'breakthrough', 'transformative', 'scaling', 'disrupting']
    }
  },
  
  value_oriented: {
    id: 'value_oriented',
    label: 'Value Assessment',
    description: 'Seeks undervalued opportunities based on fundamentals',
    approach: 'Value-focused, fundamental analysis',
    systemPrompt: `You are providing a value-oriented analysis seeking undervalued opportunities. Your analysis should:
- Calculate intrinsic value and margin of safety
- Identify undervaluation relative to assets or earnings
- Focus on sustainable competitive advantages
- Analyze free cash flow generation
- Look for hidden assets or underappreciated segments
- Evaluate management's capital allocation
- Use disciplined, value-focused language
- Always compare price to intrinsic value
- Focus on long-term wealth preservation and growth`,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/20',
    borderColor: 'border-emerald-700/30',
    analysisStyle: {
      tone: 'disciplined and patient',
      focus: ['value', 'fundamentals', 'cash flow', 'assets'],
      keywords: ['undervalued', 'margin of safety', 'intrinsic', 'sustainable', 'disciplined', 'patient']
    }
  },
  
  contrarian: {
    id: 'contrarian',
    label: 'Contrarian View',
    description: 'Goes against consensus to find hidden opportunities',
    approach: 'Contrarian, unconventional analysis',
    systemPrompt: `You are providing a contrarian analysis going against market consensus. Your analysis should:
- Challenge prevailing market narratives
- Find silver linings in negative news
- Identify overlooked strengths in troubled companies
- Question popular bearish or bullish theses
- Look for mean reversion opportunities
- Spot early turnaround signals
- Use independent, thought-provoking language
- Always present the opposite view
- Focus on what the market is missing or misunderstanding`,
    color: 'text-pink-400',
    bgColor: 'bg-pink-900/20',
    borderColor: 'border-pink-700/30',
    analysisStyle: {
      tone: 'contrarian and thought-provoking',
      focus: ['overlooked', 'misunderstood', 'turnaround', 'contrarian'],
      keywords: ['contrary', 'overlooked', 'misunderstood', 'actually', 'despite', 'hidden']
    }
  }
};

export const DEFAULT_PERSPECTIVES = ['balanced'];

export function getAnalysisPerspective(perspectiveId: string): AnalysisPerspective {
  return ANALYSIS_PERSPECTIVES[perspectiveId] || ANALYSIS_PERSPECTIVES.balanced;
}

export function formatPerspectiveResponse(content: string, perspective: AnalysisPerspective, model: string): string {
  const header = `## **${perspective.label}** _(${model})_\n\n`;
  const footer = `\n\n---\n\n`;
  
  return `${header}${content}${footer}`;
}

export function createPerspectivePrompt(
  basePrompt: string,
  perspective: AnalysisPerspective,
  companyName: string,
  additionalContext?: string
): ChatCompletionMessageParam[] {
  const systemMessage = `${perspective.systemPrompt}

Remember to:
- Maintain the ${perspective.approach} approach throughout
- Use ${perspective.analysisStyle.tone} tone
- Focus on ${perspective.analysisStyle.focus.join(', ')}
- Incorporate keywords like: ${perspective.analysisStyle.keywords.join(', ')}
- Always support your analysis with specific data from the filing
- Be concise but thorough
- Use markdown formatting for clarity`;

  const userMessage = `${basePrompt}

Company: ${companyName}
${additionalContext ? `\nAdditional Context: ${additionalContext}` : ''}

Provide your analysis from the ${perspective.label} perspective.`;

  return [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage }
  ];
}
