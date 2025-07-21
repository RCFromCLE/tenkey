/**
 * Agent-specific prompts designed to work with individual AI agent personas
 */

import type { Prompt } from '../types/filing-chat';

/**
 * Agent-specific prompt suggestions that leverage each agent's unique expertise
 */
export const AGENT_SPECIFIC_PROMPTS = {
  bull: [
    'Identify the top 3 growth catalysts and calculate their potential impact on revenue acceleration over the next 12-18 months',
    'Analyze market share expansion opportunities and quantify the total addressable market (TAM) growth potential',
    'Evaluate the company\'s competitive advantages and calculate how they translate to sustainable margin expansion',
    'Assess the innovation pipeline strength and project new product contribution to revenue growth',
    'Analyze operating leverage potential and calculate earnings acceleration scenarios from revenue growth',
    'Identify network effects, platform economics, and scalability advantages that could drive exponential growth'
  ],
  bear: [
    'Conduct comprehensive downside scenario analysis with probability-weighted outcomes and calculate potential losses',
    'Identify the top 5 business risks and quantify their potential impact on cash flows and valuation',
    'Analyze debt maturity schedule and refinancing risks under stressed market conditions',
    'Evaluate competitive threats and calculate potential market share loss scenarios',
    'Assess regulatory and compliance risks with potential penalty and business disruption impacts',
    'Analyze cash burn rate and calculate runway under various stress scenarios'
  ],
  skeptic: [
    'Perform forensic accounting analysis and identify potential earnings management red flags',
    'Challenge management\'s guidance and projections with reality checks against industry benchmarks',
    'Analyze revenue recognition policies and identify potential aggressive accounting practices',
    'Evaluate related party transactions and identify potential conflicts of interest',
    'Question the sustainability of current margins and identify potential mean reversion risks',
    'Analyze insider trading patterns and assess management incentive alignment with shareholders'
  ],
  balanced: [
    'Provide objective risk-adjusted return analysis with bull/bear/base case scenarios and probability weightings',
    'Compare company performance to industry peers across key metrics and identify relative strengths/weaknesses',
    'Evaluate capital allocation effectiveness using multiple frameworks and benchmark against best practices',
    'Assess the investment thesis from multiple perspectives and provide balanced recommendation with confidence intervals',
    'Analyze both opportunities and risks with equal weighting and create decision matrix for investment consideration',
    'Synthesize conflicting signals into coherent investment framework with clear decision criteria'
  ],
  technical: [
    'Perform DuPont analysis breakdown of ROE trends and identify primary drivers of profitability changes',
    'Calculate return on invested capital (ROIC) trends vs weighted average cost of capital (WACC) with attribution analysis',
    'Analyze working capital efficiency metrics and identify cash conversion cycle optimization opportunities',
    'Calculate economic value added (EVA) and assess value creation vs destruction over multiple periods',
    'Perform regression analysis on key financial drivers and build predictive models for future performance',
    'Analyze financial statement quality scores and assess earnings sustainability metrics'
  ],
  macro: [
    'Analyze the company\'s positioning within current economic cycle and assess sensitivity to macro factors',
    'Evaluate industry consolidation trends and assess the company\'s role in potential M&A scenarios',
    'Assess geopolitical risks and supply chain resilience in context of global trade dynamics',
    'Analyze secular trends affecting the business model and position within long-term industry evolution',
    'Evaluate ESG and sustainability positioning relative to regulatory trends and stakeholder expectations',
    'Assess currency and commodity exposure in context of global macro environment and hedging strategies'
  ],
  risk: [
    'Calculate Value at Risk (VaR) and Conditional VaR for various scenarios with Monte Carlo simulation',
    'Perform comprehensive stress testing across operational, financial, and market risk factors',
    'Analyze liquidity risk and assess cash runway under various business disruption scenarios',
    'Evaluate cybersecurity and operational risk exposure with quantified potential impact assessments',
    'Assess credit risk and counterparty exposure with default probability calculations',
    'Analyze tail risk events and calculate maximum potential downside with confidence intervals'
  ],
  growth: [
    'Analyze customer lifetime value (LTV) trends and acquisition cost (CAC) efficiency across cohorts',
    'Evaluate international expansion opportunities and calculate market penetration potential by geography',
    'Assess R&D productivity and innovation pipeline with projected revenue contribution timelines',
    'Analyze platform economics and network effects with viral coefficient and retention metrics',
    'Evaluate adjacent market opportunities and calculate expansion potential with investment requirements',
    'Assess digital transformation progress and calculate productivity gains from technology investments'
  ],
  value: [
    'Calculate intrinsic value using multiple methodologies (DCF, asset-based, earnings power value)',
    'Identify hidden assets and sum-of-the-parts valuation opportunities with private market comparisons',
    'Analyze free cash flow generation sustainability and calculate fair value based on normalized earnings',
    'Evaluate margin of safety across different valuation scenarios and assess downside protection',
    'Identify special situation catalysts (spin-offs, activist involvement, asset sales) and calculate value unlock potential',
    'Assess management\'s capital allocation track record and calculate shareholder value creation over time'
  ],
  contrarian: [
    'Challenge prevailing market narrative and identify overlooked positive developments or misunderstood metrics',
    'Analyze sentiment indicators and positioning data to identify potential mean reversion opportunities',
    'Evaluate turnaround potential and identify early signals of business model recovery or transformation',
    'Question consensus estimates and identify potential positive surprises based on leading indicators',
    'Analyze insider buying patterns and institutional positioning changes that contradict public sentiment',
    'Identify narrative violations where fundamentals diverge from market perception and calculate opportunity size'
  ],
  esg: [
    'Evaluate climate transition risks and opportunities with quantified impact on business model and valuation',
    'Assess governance quality and board effectiveness with scoring against best practice frameworks',
    'Analyze human capital management practices and calculate correlation with financial performance metrics',
    'Evaluate supply chain sustainability and assess ESG-related operational and reputational risks',
    'Assess stakeholder capitalism metrics and analyze long-term value creation for all stakeholders',
    'Evaluate ESG disclosure quality and assess potential for improved ratings and access to ESG capital'
  ]
};

/**
 * General prompts that work across all agents
 */
export const SUGGESTED_PROMPTS = {
  'common': {
    'Quick Analysis': [
      'Provide a comprehensive investment summary with key metrics, catalysts, and recommendation',
      'Analyze the most important financial trends and their implications for future performance',
      'Identify the primary investment risks and opportunities with quantified impact assessments',
      'Evaluate management effectiveness and strategic execution against stated objectives',
      'Assess competitive positioning and sustainable competitive advantages',
      'Analyze cash generation quality and capital allocation effectiveness'
    ],
    'Financial Deep Dive': [
      'Perform a DuPont analysis breakdown of ROE trends and identify the primary drivers of profitability changes',
      'Calculate and analyze free cash flow conversion, working capital efficiency, and cash generation quality',
      'Evaluate debt structure, maturity profile, and refinancing risks with stress test scenarios',
      'Analyze revenue quality, customer concentration, and recurring revenue sustainability',
      'Assess margin trends by segment and identify operating leverage opportunities',
      'Calculate economic value added (EVA) and return on invested capital (ROIC) trends vs cost of capital',
    ],
    'Growth Analysis': [
      'Analyze total addressable market (TAM) expansion and the company\'s market share trajectory',
      'Evaluate the innovation pipeline, R&D productivity, and new product launch success rates',
      'Assess international expansion opportunities and geographic revenue diversification potential',
      'Calculate customer lifetime value (LTV), acquisition costs (CAC), and cohort retention metrics',
      'Identify network effects, platform economics, and scalability advantages',
      'Analyze organic vs inorganic growth strategies and M&A integration success',
    ],
    'Risk & ESG Assessment': [
      'Conduct comprehensive risk assessment including operational, financial, regulatory, and ESG factors',
      'Evaluate climate transition risks, carbon intensity, and sustainability initiatives ROI',
      'Assess governance quality, board effectiveness, and management incentive alignment',
      'Analyze supply chain resilience, geopolitical exposure, and business continuity planning',
      'Identify potential accounting red flags, earnings quality issues, and forensic concerns',
      'Evaluate cybersecurity posture, data privacy compliance, and technology infrastructure risks',
    ],
    'Valuation & Timing': [
      'Build a multi-method valuation model (DCF, comparable company, precedent transaction analysis)',
      'Perform sensitivity analysis on key valuation drivers and calculate margin of safety',
      'Analyze insider trading patterns, institutional ownership changes, and smart money positioning',
      'Evaluate market timing factors, sector rotation trends, and macroeconomic sensitivity',
      'Compare current valuation to historical trading ranges and identify mean reversion opportunities',
      'Assess special situation potential (spin-offs, activist involvement, restructuring catalysts)',
    ],
    'Operational Excellence': [
      'Analyze operational efficiency metrics, capacity utilization, and productivity improvements',
      'Evaluate digital transformation progress, technology adoption, and automation benefits',
      'Assess human capital management, employee engagement, and talent retention strategies',
      'Analyze supply chain optimization, vendor relationships, and cost structure flexibility',
      'Evaluate customer satisfaction metrics, Net Promoter Scores, and brand strength indicators',
      'Assess working capital optimization opportunities and cash conversion cycle improvements',
    ],
  },
  '10-K': {
    'Strategic Analysis': [
      'Analyze the company\'s business model evolution, competitive positioning, and strategic moat sustainability over the past 3-5 years',
      'Evaluate management\'s capital allocation strategy, including M&A track record, dividend policy, and share repurchase effectiveness',
      'Assess the company\'s industry positioning, market share trends, and competitive response to disruption threats',
      'Analyze geographic and segment diversification strategy and identify the highest-return growth opportunities',
      'Evaluate the effectiveness of digital transformation initiatives and technology investments on operational efficiency',
      'Assess ESG integration into business strategy and quantify sustainability initiatives\' impact on long-term value creation',
    ],
    'Financial Architecture': [
      'Perform comprehensive balance sheet analysis including off-balance sheet commitments, contingent liabilities, and hidden assets',
      'Analyze debt structure, covenant compliance, refinancing schedule, and optimal capital structure vs current leverage',
      'Evaluate pension and post-retirement benefit obligations, funding status, and impact on future cash flows',
      'Assess working capital management efficiency, cash conversion cycle optimization, and seasonal financing needs',
      'Analyze tax strategy effectiveness, rate sustainability, and impact of regulatory changes on future tax burden',
      'Evaluate critical accounting policies, estimate sensitivity, and potential earnings management red flags',
    ],
    'Long-term Value Creation': [
      'Build 5-year financial projections based on management guidance, industry trends, and competitive dynamics',
      'Analyze R&D productivity, innovation pipeline strength, and intellectual property portfolio value',
      'Evaluate human capital strategy, talent retention, succession planning, and organizational capability building',
      'Assess supply chain resilience, vendor diversification, and vertical integration vs outsourcing trade-offs',
      'Analyze customer relationship strength, pricing power sustainability, and brand equity evolution',
      'Evaluate regulatory compliance posture, litigation risks, and potential policy impacts on business model',
    ],
  },
  '10-Q': {
    'Quarterly Performance Deep Dive': [
      'Analyze quarterly earnings quality, one-time adjustments, and underlying business momentum vs management guidance',
      'Evaluate sequential and year-over-year margin trends by segment and identify primary drivers of profitability changes',
      'Assess cash flow generation quality, working capital movements, and free cash flow conversion sustainability',
      'Analyze revenue recognition timing, customer concentration changes, and backlog/pipeline strength indicators',
      'Evaluate expense management effectiveness, cost inflation mitigation, and operating leverage realization',
      'Assess balance sheet changes, liquidity position, and debt covenant compliance vs financial flexibility needs',
    ],
    'Market Dynamics & Positioning': [
      'Analyze market share gains/losses, competitive positioning changes, and pricing power demonstration this quarter',
      'Evaluate customer acquisition trends, retention metrics, and lifetime value progression across segments',
      'Assess new product launch performance, market reception, and contribution to revenue growth acceleration',
      'Analyze geographic performance variations, international expansion progress, and currency impact management',
      'Evaluate supply chain performance, inventory management, and cost structure flexibility demonstration',
      'Assess digital channel performance, e-commerce growth, and omnichannel strategy execution effectiveness',
    ],
    'Forward-Looking Catalysts': [
      'Analyze updated management guidance credibility, achievability, and implied margin/growth trajectory changes',
      'Evaluate upcoming product launches, market expansions, and strategic initiatives likely to impact next quarters',
      'Assess seasonal patterns, cyclical positioning, and macroeconomic sensitivity for remainder of fiscal year',
      'Analyze capital allocation priorities, M&A pipeline, and shareholder return policy evolution signals',
      'Evaluate regulatory developments, policy changes, and industry trends likely to impact competitive position',
      'Assess management commentary on long-term strategy execution, investment priorities, and market outlook confidence',
    ],
  },
} as const;

/**
 * Function to flatten the nested prompt structure into a flat array of Prompt objects
 * @returns Array of Prompt objects with unique IDs
 */
export function flattenPrompts(): Prompt[] {
  const allPrompts: Prompt[] = [];
  let idCounter = 0;

  for (const type of Object.keys(SUGGESTED_PROMPTS)) {
    const categories = SUGGESTED_PROMPTS[type as keyof typeof SUGGESTED_PROMPTS];
    for (const category in categories) {
      const prompts = (categories as any)[category];
      for (const text of prompts) {
        allPrompts.push({
          id: `${type}-${idCounter++}`,
          text,
          category: category,
          filingType: type as 'common' | '10-K' | '10-Q',
        });
      }
    }
  }
  return allPrompts;
}

/**
 * Default prompts array for initial component state
 */
export const DEFAULT_PROMPTS = flattenPrompts();

/**
 * Get agent-specific prompts for a given agent ID
 */
export function getAgentSpecificPrompts(agentId: string): string[] {
  return AGENT_SPECIFIC_PROMPTS[agentId as keyof typeof AGENT_SPECIFIC_PROMPTS] || [];
}

/**
 * Get all available agent IDs that have specific prompts
 */
export function getAvailableAgentIds(): string[] {
  return Object.keys(AGENT_SPECIFIC_PROMPTS);
}

/**
 * Create a prompt object for agent-specific prompts
 */
export function createAgentPrompt(agentId: string, promptText: string, index: number): Prompt {
  return {
    id: `agent-${agentId}-${index}`,
    text: promptText,
    category: `${agentId.charAt(0).toUpperCase() + agentId.slice(1)} Analysis`,
    filingType: 'common',
    agentId: agentId
  };
}

/**
 * Get all agent-specific prompts as Prompt objects
 */
export function getAllAgentPrompts(): Prompt[] {
  const agentPrompts: Prompt[] = [];
  
  for (const agentId of getAvailableAgentIds()) {
    const prompts = getAgentSpecificPrompts(agentId);
    prompts.forEach((promptText, index) => {
      agentPrompts.push(createAgentPrompt(agentId, promptText, index));
    });
  }
  
  return agentPrompts;
}
