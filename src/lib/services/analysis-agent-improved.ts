// Enhanced Analysis Agent with Advanced Capabilities
import { OpenRouterService } from './openrouter';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { 
  AGENT_PERSONAS, 
  getAgentPersona, 
  formatAgentResponse, 
  createAgentPrompt,
  type AgentPersona 
} from './agent-personas-improved';

interface AnalysisOptions {
  includeOpinion: boolean;
  includeKeyInsights: boolean;
  includeRiskAssessment: boolean;
  includeRecommendations: boolean;
  includeMetrics?: boolean;
  includeScenarios?: boolean;
  includeTechnicalAnalysis?: boolean;
  model?: string;
  apiKey?: string;
  agentPersonas?: string[];
  analysisDepth?: 'quick' | 'standard' | 'deep';
  outputFormat?: 'narrative' | 'structured' | 'executive';
}

interface AnalysisResult {
  opinion: string;
  keyInsights: string[];
  riskAssessment: string;
  recommendations: string[];
  metrics?: Record<string, any>;
  scenarios?: {
    bull: { probability: number; target: number; thesis: string };
    base: { probability: number; target: number; thesis: string };
    bear: { probability: number; target: number; thesis: string };
  };
  confidence: 'high' | 'medium' | 'low';
  consensus?: 'strong buy' | 'buy' | 'hold' | 'sell' | 'strong sell';
}

interface AgentAnalysisCache {
  [key: string]: {
    timestamp: number;
    analysis: string;
    metrics: Record<string, any>;
  };
}

export class EnhancedAnalysisAgent {
  private static instance: EnhancedAnalysisAgent;
  private defaultModel: string = 'openai/gpt-4o-mini';
  private activeAgents: string[] = [];
  private analysisCache: AgentAnalysisCache = {};
  private cacheTimeout: number = 300000; // 5 minutes
  
  static getInstance(): EnhancedAnalysisAgent {
    if (!EnhancedAnalysisAgent.instance) {
      EnhancedAnalysisAgent.instance = new EnhancedAnalysisAgent();
    }
    return EnhancedAnalysisAgent.instance;
  }

  /**
   * Set the active agent personas with validation
   */
  setActiveAgents(agents: string[]) {
    // Validate agent IDs
    const validAgents = agents.filter(id => AGENT_PERSONAS[id]);
    if (validAgents.length === 0 && agents.length > 0) {
      console.warn('No valid agent IDs provided, using default');
      this.activeAgents = ['balanced'];
    } else {
      this.activeAgents = validAgents;
    }
  }

  /**
   * Get the active agent personas
   */
  getActiveAgents(): string[] {
    return this.activeAgents;
  }

  /**
   * Get all available agent personas
   */
  getAvailableAgents(): AgentPersona[] {
    return Object.values(AGENT_PERSONAS);
  }

  /**
   * Get agent recommendations based on market conditions
   */
  getRecommendedAgents(marketConditions: {
    volatility: 'low' | 'medium' | 'high';
    trend: 'bullish' | 'bearish' | 'neutral';
    sector?: string;
  }): string[] {
    const recommendations: string[] = ['balanced']; // Always include balanced

    if (marketConditions.volatility === 'high') {
      recommendations.push('risk', 'technical');
    }

    if (marketConditions.trend === 'bullish') {
      recommendations.push('bull', 'growth');
    } else if (marketConditions.trend === 'bearish') {
      recommendations.push('bear', 'value');
    }

    if (marketConditions.sector === 'technology') {
      recommendations.push('growth', 'technical');
    } else if (marketConditions.sector === 'utilities' || marketConditions.sector === 'consumer_staples') {
      recommendations.push('value', 'esg');
    }

    // Remove duplicates - convert to array for ES5 compatibility
    const uniqueRecs = recommendations.filter((value, index, self) => self.indexOf(value) === index);
    return uniqueRecs;
  }

  /**
   * Set the default model for analysis
   */
  setDefaultModel(model: string) {
    this.defaultModel = model;
  }

  /**
   * Get the default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache = {};
  }

  /**
   * Main analysis method with enhanced capabilities
   */
  async analyzeContent(
    formattedContent: string,
    apiKey: string,
    companyName: string,
    options: AnalysisOptions = {
      includeOpinion: true,
      includeKeyInsights: true,
      includeRiskAssessment: true,
      includeRecommendations: true,
      includeMetrics: true,
      includeScenarios: false,
      includeTechnicalAnalysis: false,
      analysisDepth: 'standard'
    }
  ): Promise<string> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(formattedContent, companyName, options);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached.analysis;
      }

      // Use LLM-based analysis if API key is provided
      if (apiKey && options.model) {
        const analysis = await this.llmAnalysis(formattedContent, apiKey, companyName, options);
        this.saveToCache(cacheKey, analysis, {});
        return analysis;
      }
      
      // Fallback to enhanced rule-based analysis
      return this.enhancedAnalysis(formattedContent, companyName, options);
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to basic analysis if enhanced analysis fails
      return this.fallbackAnalysis(formattedContent, companyName);
    }
  }

  /**
   * Enhanced LLM-based analysis with agent coordination
   */
  private async llmAnalysis(
    content: string,
    apiKey: string,
    companyName: string,
    options: AnalysisOptions
  ): Promise<string> {
    const model = options.model || this.defaultModel;
    const agentPersonas = options.agentPersonas || this.activeAgents || [];
    
    // If no agents are selected, return empty
    if (agentPersonas.length === 0) {
      return '';
    }

    // Determine analysis depth
    const depth = options.analysisDepth || 'standard';

    let combinedAnalysis = '\n\n---\n\n# **AI Multi-Agent Analysis Report**\n\n';
    combinedAnalysis += `*Analysis performed by ${agentPersonas.length} specialized agent${agentPersonas.length > 1 ? 's' : ''}*\n\n`;

    // Add market context if available
    const marketContext = this.extractMarketContext(content);
    if (marketContext) {
      combinedAnalysis += `## **Market Context**\n\n`;
      combinedAnalysis += `- **Sector**: ${marketContext.sector || 'N/A'}\n`;
      combinedAnalysis += `- **Market Cap**: ${marketContext.marketCap || 'N/A'}\n`;
      combinedAnalysis += `- **Recent Performance**: ${marketContext.performance || 'N/A'}\n\n`;
    }

    // Collect all agent analyses
    const agentAnalyses: { persona: AgentPersona; analysis: string }[] = [];

    // Run analysis for each selected agent persona
    for (const agentId of agentPersonas) {
      const persona = getAgentPersona(agentId);
      
      try {
        const basePrompt = this.createEnhancedPrompt(content, options, depth);
        const messages = createAgentPrompt(basePrompt, persona, companyName);
        
        const openrouter = OpenRouterService.getInstance();
        const completion = await openrouter.createChatCompletion(
          messages, 
          model, 
          apiKey
        );
        
        if (completion) {
          agentAnalyses.push({ persona, analysis: completion });
          combinedAnalysis += formatAgentResponse(completion, persona, model);
        }
      } catch (error) {
        console.error(`${persona.name} analysis error:`, error);
        // Continue with other agents even if one fails
      }
    }

    // Add consensus section if multiple agents
    if (agentAnalyses.length > 1) {
      combinedAnalysis += await this.generateConsensusAnalysis(agentAnalyses, companyName, apiKey, model);
    }

    // Add technical metrics if requested
    if (options.includeMetrics) {
      combinedAnalysis += this.generateMetricsSection(content);
    }

    // Add scenario analysis if requested
    if (options.includeScenarios) {
      combinedAnalysis += await this.generateScenarioAnalysis(content, companyName, apiKey, model);
    }

    combinedAnalysis += '---\n\n';
    
    return combinedAnalysis;
  }

  /**
   * Stream LLM analysis for real-time updates with enhanced features
   */
  async *streamAnalysis(
    content: string,
    apiKey: string,
    companyName: string,
    options: AnalysisOptions
  ): AsyncGenerator<string, void, unknown> {
    const model = options.model || this.defaultModel;
    const agentPersonas = options.agentPersonas || this.activeAgents || [];
    
    // If no agents are selected, return empty
    if (agentPersonas.length === 0) {
      return;
    }

    yield '\n\n---\n\n# **AI Multi-Agent Analysis Report**\n\n';
    yield `*Real-time analysis by ${agentPersonas.length} specialized agent${agentPersonas.length > 1 ? 's' : ''}*\n\n`;

    // Stream market context
    const marketContext = this.extractMarketContext(content);
    if (marketContext) {
      yield `## **Market Context**\n\n`;
      yield `- **Sector**: ${marketContext.sector || 'N/A'}\n`;
      yield `- **Market Cap**: ${marketContext.marketCap || 'N/A'}\n`;
      yield `- **Recent Performance**: ${marketContext.performance || 'N/A'}\n\n`;
    }

    // Stream analysis for each selected agent persona
    for (const agentId of agentPersonas) {
      const persona = getAgentPersona(agentId);
      
      try {
        const basePrompt = this.createStreamingPrompt(content, options);
        const messages = createAgentPrompt(basePrompt, persona, companyName);
        
        const openrouter = OpenRouterService.getInstance();
        const stream = await openrouter.streamChatCompletion(messages, model, apiKey);
        
        yield `## **${persona.emoji} ${persona.name}** _(${model})_\n\n`;
        
        for await (const chunk of stream) {
          if (chunk.choices[0]?.delta?.content) {
            yield chunk.choices[0].delta.content;
          }
        }
        
        yield '\n\n---\n\n';
      } catch (error) {
        console.error(`${persona.name} stream analysis error:`, error);
        yield `*Error generating ${persona.name} analysis*\n\n---\n\n`;
      }
    }

    // Stream summary section if multiple agents
    if (agentPersonas.length > 1) {
      yield '\n## **Key Takeaways**\n\n';
      yield `This multi-perspective analysis provides diverse viewpoints from ${agentPersonas.length} specialized agents:\n\n`;
      
      for (const agentId of agentPersonas) {
        const persona = getAgentPersona(agentId);
        yield `- **${persona.emoji} ${persona.name}**: Focus on ${persona.analysisStyle.focus.join(', ')}\n`;
      }
      
      yield '\n\nConsider all perspectives when making investment decisions.\n\n';
    }

    yield '---\n\n';
  }

  /**
   * Generate consensus analysis from multiple agent perspectives
   */
  private async generateConsensusAnalysis(
    agentAnalyses: { persona: AgentPersona; analysis: string }[],
    companyName: string,
    apiKey: string,
    model: string
  ): Promise<string> {
    let consensus = '\n## **Consensus Analysis**\n\n';

    try {
      // Create a synthesis prompt
      const synthesisPrompt = `Based on the following analyses from different investment perspectives, provide a brief consensus view:

${agentAnalyses.map(a => `${a.persona.name}: ${a.analysis.substring(0, 500)}...`).join('\n\n')}

Provide:
1. Overall consensus rating (Strong Buy/Buy/Hold/Sell/Strong Sell)
2. Key points of agreement
3. Key points of disagreement
4. Weighted recommendation considering all perspectives`;

      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: 'You are a senior investment analyst synthesizing multiple viewpoints into a consensus recommendation.' },
        { role: 'user', content: synthesisPrompt }
      ];

      const openrouter = OpenRouterService.getInstance();
      const synthesis = await openrouter.createChatCompletion(messages, model, apiKey);

      if (synthesis) {
        consensus += synthesis + '\n\n';
      }
    } catch (error) {
      console.error('Consensus generation error:', error);
      // Fallback to simple consensus
      consensus += this.generateSimpleConsensus(agentAnalyses);
    }

    return consensus;
  }

  /**
   * Generate simple consensus without LLM
   */
  private generateSimpleConsensus(agentAnalyses: { persona: AgentPersona; analysis: string }[]): string {
    let consensus = '### **Agent Perspectives Summary**\n\n';
    
    const sentiments = {
      bullish: 0,
      bearish: 0,
      neutral: 0
    };

    for (const { persona, analysis } of agentAnalyses) {
      const sentiment = this.analyzeSentiment(analysis);
      sentiments[sentiment]++;
      
      consensus += `- **${persona.emoji} ${persona.name}**: ${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} outlook\n`;
    }

    consensus += '\n### **Overall Sentiment**\n\n';
    const total = agentAnalyses.length;
    consensus += `- Bullish: ${((sentiments.bullish / total) * 100).toFixed(0)}%\n`;
    consensus += `- Neutral: ${((sentiments.neutral / total) * 100).toFixed(0)}%\n`;
    consensus += `- Bearish: ${((sentiments.bearish / total) * 100).toFixed(0)}%\n\n`;

    return consensus;
  }

  /**
   * Generate metrics section
   */
  private generateMetricsSection(content: string): string {
    const metrics = this.extractEnhancedMetrics(content);
    let section = '\n## **Key Financial Metrics**\n\n';

    if (metrics.revenue.length > 0) {
      section += `### Revenue\n`;
      metrics.revenue.forEach((r: string) => section += `- ${r}\n`);
      section += '\n';
    }

    if (metrics.profitability.length > 0) {
      section += `### Profitability\n`;
      metrics.profitability.forEach((p: string) => section += `- ${p}\n`);
      section += '\n';
    }

    if (metrics.efficiency.length > 0) {
      section += `### Efficiency Metrics\n`;
      metrics.efficiency.forEach((e: string) => section += `- ${e}\n`);
      section += '\n';
    }

    if (metrics.valuation.length > 0) {
      section += `### Valuation\n`;
      metrics.valuation.forEach((v: string) => section += `- ${v}\n`);
      section += '\n';
    }

    return section;
  }

  /**
   * Generate scenario analysis
   */
  private async generateScenarioAnalysis(
    content: string,
    companyName: string,
    apiKey: string,
    model: string
  ): Promise<string> {
    let scenarios = '\n## **Scenario Analysis**\n\n';

    try {
      const scenarioPrompt = `Based on the financial data provided, create three scenarios for ${companyName}:

1. Bull Case (30% probability): Best case scenario with key catalysts
2. Base Case (50% probability): Most likely scenario
3. Bear Case (20% probability): Worst case scenario with key risks

For each scenario, provide:
- Price target or valuation range
- Key assumptions
- Major catalysts or risks`;

      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: 'You are a financial analyst creating scenario analysis.' },
        { role: 'user', content: scenarioPrompt + '\n\nData:\n' + content.substring(0, 2000) }
      ];

      const openrouter = OpenRouterService.getInstance();
      const analysis = await openrouter.createChatCompletion(messages, model, apiKey);

      if (analysis) {
        scenarios += analysis + '\n\n';
      }
    } catch (error) {
      console.error('Scenario analysis error:', error);
      scenarios += 'Scenario analysis unavailable.\n\n';
    }

    return scenarios;
  }

  /**
   * Create enhanced prompt based on analysis options
   */
  private createEnhancedPrompt(content: string, options: AnalysisOptions, depth: string): string {
    let prompt = `Analyze the following financial information for detailed insights:\n\n${content}\n\n`;
    
    prompt += 'Please provide:\n';
    
    if (options.includeOpinion) {
      prompt += '1. **Investment Thesis**: Your overall assessment with specific reasoning\n';
    }
    
    if (options.includeKeyInsights) {
      prompt += '2. **Key Insights**: Most important findings with supporting data\n';
    }
    
    if (options.includeRiskAssessment) {
      prompt += '3. **Risk Analysis**: Major risks quantified with probabilities where possible\n';
    }
    
    if (options.includeRecommendations) {
      prompt += '4. **Action Items**: Specific recommendations with expected outcomes\n';
    }

    if (options.includeTechnicalAnalysis) {
      prompt += '5. **Technical Factors**: Key ratios, trends, and comparative metrics\n';
    }

    prompt += `\nAnalysis depth: ${depth}. `;
    
    if (depth === 'quick') {
      prompt += 'Be concise and focus on the most critical points.';
    } else if (depth === 'deep') {
      prompt += 'Provide comprehensive analysis with detailed explanations and calculations.';
    } else {
      prompt += 'Balance detail with clarity, focusing on actionable insights.';
    }

    return prompt;
  }

  /**
   * Create streaming-optimized prompt
   */
  private createStreamingPrompt(content: string, options: AnalysisOptions): string {
    return `Analyze this financial data and provide key insights in a concise, streaming-friendly format:\n\n${content}\n\nFocus on the most important findings and actionable insights.`;
  }

  /**
   * Extract market context from content
   */
  private extractMarketContext(content: string): any {
    const context: any = {};

    // Extract sector
    const sectorMatch = content.match(/(?:sector|industry):\s*([^\n,]+)/i);
    if (sectorMatch) context.sector = sectorMatch[1].trim();

    // Extract market cap
    const marketCapMatch = content.match(/market\s*cap(?:italization)?:?\s*\$?([\d,]+(?:\.\d+)?(?:\s*[BMT])?)/i);
    if (marketCapMatch) context.marketCap = marketCapMatch[1];

    // Extract performance
    const perfMatch = content.match(/(?:ytd|year-to-date|annual)\s*(?:return|performance):?\s*([-+]?\d+(?:\.\d+)?%)/i);
    if (perfMatch) context.performance = perfMatch[1];

    return Object.keys(context).length > 0 ? context : null;
  }

  /**
   * Extract enhanced metrics from content
   */
  private extractEnhancedMetrics(content: string): any {
    return {
      revenue: this.extractMetric(content, /revenue.*?(\$[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|thousand|B|M|K))?)/gi),
      profitability: this.extractMetric(content, /(?:margin|profit|earnings|ebitda).*?(\d+(?:\.\d+)?%|\$[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|B|M))?)/gi),
      efficiency: this.extractMetric(content, /(?:roi|roic|roe|roa).*?(\d+(?:\.\d+)?%)/gi),
      valuation: this.extractMetric(content, /(?:p\/e|pe|ev\/ebitda|price\/book).*?(\d+(?:\.\d+)?x?)/gi),
      growth: this.extractMetric(content, /(?:growth|cagr|increase).*?(\d+(?:\.\d+)?%)/gi),
      debt: this.extractMetric(content, /(?:debt|leverage).*?(\$[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|B|M))?|\d+(?:\.\d+)?x)/gi)
    };
  }

  /**
   * Extract specific metric patterns
   */
  private extractMetric(content: string, regex: RegExp): string[] {
    const matches = content.match(regex) || [];
    // Remove duplicates using filter and indexOf for ES5 compatibility
    const uniqueMatches = matches.filter((value, index, self) => self.indexOf(value) === index);
    return uniqueMatches.slice(0, 5); // Limit to top 5 unique matches
  }

  /**
   * Analyze sentiment from text
   */
  private analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
    const bullishTerms = ['growth', 'strong', 'outperform', 'positive', 'opportunity', 'upside', 'accelerating', 'improving'];
    const bearishTerms = ['risk', 'concern', 'weak', 'decline', 'challenge', 'downside', 'deteriorating', 'pressure'];
    
    const bullishCount = bullishTerms.filter(term => 
      text.toLowerCase().includes(term)
    ).length;
    
    const bearishCount = bearishTerms.filter(term => 
      text.toLowerCase().includes(term)
    ).length;
    
    if (bullishCount > bearishCount * 1.5) return 'bullish';
    if (bearishCount > bullishCount * 1.5) return 'bearish';
    return 'neutral';
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(content: string, companyName: string, options: AnalysisOptions): string {
    const optionsStr = JSON.stringify(options);
    const contentHash = this.simpleHash(content);
    return `${companyName}-${contentHash}-${optionsStr}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get from cache if valid
   */
  private getFromCache(key: string): { analysis: string; metrics: Record<string, any> } | null {
    const cached = this.analysisCache[key];
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { analysis: cached.analysis, metrics: cached.metrics };
    }
    return null;
  }

  /**
   * Save to cache
   */
  private saveToCache(key: string, analysis: string, metrics: Record<string, any>) {
    this.analysisCache[key] = {
      timestamp: Date.now(),
      analysis,
      metrics
    };
  }

  /**
   * Enhanced rule-based analysis
   */
  private enhancedAnalysis(content: string, companyName: string, options: AnalysisOptions): string {
    const metrics = this.extractEnhancedMetrics(content);
    let result = '\n\n---\n\n## **Automated Analysis**\n\n';

    if (options.includeOpinion) {
      result += this.generateEnhancedOpinion(metrics, companyName);
    }

    if (options.includeKeyInsights) {
      result += this.generateEnhancedInsights(metrics);
    }

    if (options.includeRiskAssessment) {
      result += this.generateEnhancedRiskAssessment(metrics, content);
    }

    if (options.includeRecommendations) {
      result += this.generateEnhancedRecommendations(metrics, companyName);
    }

    if (options.includeMetrics) {
      result += this.generateMetricsSection(content);
    }

    result += '\n---\n\n';
    return result;
  }

  /**
   * Generate enhanced opinion
   */
  private generateEnhancedOpinion(metrics: any, companyName: string): string {
    let opinion = '### **Executive Opinion**\n\n';
    
    const hasRevenue = metrics.revenue.length > 0;
    const hasGrowth = metrics.growth.length > 0;
    const hasProfitability = metrics.profitability.length > 0;
    
    if (hasRevenue && hasGrowth && hasProfitability) {
      opinion += `> ${companyName} presents a comprehensive financial profile with `;
      opinion += `revenue of ${metrics.revenue[0]}, `;
      if (hasGrowth) opinion += `growth metrics showing ${metrics.growth[0]}, `;
      if (hasProfitability) opinion += `and profitability indicators at ${metrics.profitability[0]}. `;
      opinion += `This combination suggests a ${this.assessFinancialHealth(metrics)} financial position.\n\n`;
    } else {
      opinion += `> ${companyName} financial data shows ${hasRevenue ? 'revenue metrics' : 'limited revenue visibility'} `;
      opinion += `with ${hasGrowth ? 'identifiable growth trends' : 'unclear growth trajectory'}. `;
      opinion += `Further analysis recommended for comprehensive assessment.\n\n`;
    }
    
    return opinion;
  }

  /**
   * Generate enhanced insights
   */
  private generateEnhancedInsights(metrics: any): string {
    let insights = '### **Key Insights**\n\n';
    const insightsList: string[] = [];

    // Revenue insights
    if (metrics.revenue.length > 0) {
      insightsList.push(`**Revenue Performance**: ${metrics.revenue[0]} - ${this.interpretRevenue(metrics.revenue[0])}`);
    }

    // Growth insights
    if (metrics.growth.length > 0) {
      const growthRate = parseFloat(metrics.growth[0]);
      if (!isNaN(growthRate)) {
        insightsList.push(`**Growth Trajectory**: ${metrics.growth[0]} - ${this.interpretGrowth(growthRate)}`);
      }
    }

    // Profitability insights
    if (metrics.profitability.length > 0) {
      insightsList.push(`**Profitability Analysis**: ${metrics.profitability[0]} - indicating ${this.interpretProfitability(metrics.profitability[0])}`);
    }

    // Efficiency insights
    if (metrics.efficiency.length > 0) {
      insightsList.push(`**Operational Efficiency**: ${metrics.efficiency[0]} - ${this.interpretEfficiency(metrics.efficiency[0])}`);
    }

    // Valuation insights
    if (metrics.valuation.length > 0) {
      insightsList.push(`**Valuation Metrics**: ${metrics.valuation[0]} - ${this.interpretValuation(metrics.valuation[0])}`);
    }

    if (insightsList.length === 0) {
      insightsList.push('**Limited Data**: Comprehensive metrics not available in current dataset');
    }

    insightsList.forEach(insight => {
      insights += `• ${insight}\n`;
    });

    insights += '\n';
    return insights;
  }

  /**
   * Generate enhanced risk assessment
   */
  private generateEnhancedRiskAssessment(metrics: any, content: string): string {
    let risk = '### **Risk Assessment**\n\n';
    const risks: string[] = [];

    // Debt risk
    if (metrics.debt.length > 0) {
      risks.push(`**Leverage Risk**: Debt levels at ${metrics.debt[0]} require monitoring for serviceability`);
    }

    // Growth risk
    const growthConcerns = content.toLowerCase().includes('decelerat') || content.toLowerCase().includes('slow');
    if (growthConcerns) {
      risks.push(`**Growth Risk**: Potential deceleration signals detected in narrative`);
    }

    // Profitability risk
    const marginPressure = content.toLowerCase().includes('margin pressure') || content.toLowerCase().includes('margin compression');
    if (marginPressure) {
      risks.push(`**Margin Risk**: Profitability pressures identified requiring strategic response`);
    }

    // Market risk
    const marketRisks = ['competition', 'regulatory', 'macro', 'geopolitical'];
    const identifiedMarketRisks = marketRisks.filter(risk => content.toLowerCase().includes(risk));
    if (identifiedMarketRisks.length > 0) {
      risks.push(`**External Risks**: Exposure to ${identifiedMarketRisks.join(', ')} factors`);
    }

    if (risks.length === 0) {
      risks.push('**Risk Profile**: No significant risk indicators identified in current analysis');
    }

    risks.forEach(riskItem => {
      risk += `• ${riskItem}\n`;
    });

    risk += '\n';
    return risk;
  }

  /**
   * Generate enhanced recommendations
   */
  private generateEnhancedRecommendations(metrics: any, companyName: string): string {
    let recommendations = '### **Strategic Recommendations**\n\n';
    const recs: string[] = [];

    // Growth-based recommendations
    if (metrics.growth.length > 0) {
      const growthRate = parseFloat(metrics.growth[0]);
      if (!isNaN(growthRate) && growthRate > 15) {
        recs.push(`**Growth Strategy**: Capitalize on strong ${metrics.growth[0]} growth momentum through market expansion`);
      } else if (!isNaN(growthRate) && growthRate < 5) {
        recs.push(`**Growth Revival**: Address slowing growth through innovation and market development`);
      }
    }

    // Profitability recommendations
    if (metrics.profitability.length > 0) {
      recs.push(`**Margin Management**: Focus on operational efficiency to optimize ${metrics.profitability[0]} margins`);
    }

    // Efficiency recommendations
    if (metrics.efficiency.length > 0) {
      recs.push(`**Capital Efficiency**: Leverage ${metrics.efficiency[0]} returns through strategic investments`);
    }

    // Debt recommendations
    if (metrics.debt.length > 0) {
      recs.push(`**Balance Sheet**: Monitor debt levels at ${metrics.debt[0]} for optimal capital structure`);
    }

    if (recs.length === 0) {
      recs.push(`**Strategic Review**: Conduct comprehensive analysis of ${companyName} for detailed recommendations`);
    }

    recs.forEach(rec => {
      recommendations += `• ${rec}\n`;
    });

    recommendations += '\n';
    return recommendations;
  }

  /**
   * Fallback analysis when enhanced analysis fails
   */
  private fallbackAnalysis(content: string, companyName: string): string {
    return `\n\n---\n\n## **Basic Analysis for ${companyName}**\n\n` +
           `Due to processing limitations, a simplified analysis has been generated.\n\n` +
           `### **Summary**\n\n` +
           `The provided financial data for ${companyName} contains various metrics and information ` +
           `that would benefit from detailed analysis using the AI-powered agent system.\n\n` +
           `### **Recommendation**\n\n` +
           `Please ensure you have:\n` +
           `1. Selected at least one analysis agent\n` +
           `2. Configured your API key properly\n` +
           `3. Selected an appropriate AI model\n\n` +
           `This will enable comprehensive multi-agent analysis with detailed insights.\n\n---\n\n`;
  }

  /**
   * Assess financial health based on metrics
   */
  private assessFinancialHealth(metrics: any): string {
    const hasPositiveGrowth = metrics.growth.some((g: string) => {
      const rate = parseFloat(g);
      return !isNaN(rate) && rate > 0;
    });

    const hasStrongProfitability = metrics.profitability.some((p: string) => {
      const margin = parseFloat(p);
      return !isNaN(margin) && margin > 15;
    });

    if (hasPositiveGrowth && hasStrongProfitability) {
      return 'strong';
    } else if (hasPositiveGrowth || hasStrongProfitability) {
      return 'moderate';
    } else {
      return 'challenging';
    }
  }

  /**
   * Interpret revenue metrics
   */
  private interpretRevenue(revenue: string): string {
    if (revenue.includes('billion') || revenue.includes('B')) {
      return 'indicating significant market presence';
    } else if (revenue.includes('million') || revenue.includes('M')) {
      return 'reflecting mid-market positioning';
    } else {
      return 'suggesting emerging market status';
    }
  }

  /**
   * Interpret growth rate
   */
  private interpretGrowth(growthRate: number): string {
    if (growthRate > 20) {
      return 'exceptional growth trajectory';
    } else if (growthRate > 10) {
      return 'strong growth momentum';
    } else if (growthRate > 5) {
      return 'moderate growth pace';
    } else if (growthRate > 0) {
      return 'modest growth trend';
    } else {
      return 'growth challenges requiring attention';
    }
  }

  /**
   * Interpret profitability metrics
   */
  private interpretProfitability(profitability: string): string {
    const margin = parseFloat(profitability);
    if (!isNaN(margin)) {
      if (margin > 20) {
        return 'excellent operational efficiency';
      } else if (margin > 10) {
        return 'healthy profit margins';
      } else if (margin > 5) {
        return 'moderate profitability';
      } else {
        return 'margin improvement opportunities';
      }
    }
    return 'profitability levels requiring analysis';
  }

  /**
   * Interpret efficiency metrics
   */
  private interpretEfficiency(efficiency: string): string {
    const rate = parseFloat(efficiency);
    if (!isNaN(rate)) {
      if (rate > 20) {
        return 'superior capital efficiency';
      } else if (rate > 15) {
        return 'strong operational performance';
      } else if (rate > 10) {
        return 'adequate efficiency levels';
      } else {
        return 'efficiency enhancement potential';
      }
    }
    return 'efficiency metrics for evaluation';
  }

  /**
   * Interpret valuation metrics
   */
  private interpretValuation(valuation: string): string {
    const multiple = parseFloat(valuation);
    if (!isNaN(multiple)) {
      if (multiple > 30) {
        return 'premium valuation reflecting growth expectations';
      } else if (multiple > 20) {
        return 'above-average valuation multiples';
      } else if (multiple > 15) {
        return 'reasonable valuation levels';
      } else {
        return 'attractive valuation opportunity';
      }
    }
    return 'valuation metrics for consideration';
  }
}
