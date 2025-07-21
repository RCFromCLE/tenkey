// src/lib/services/financial-analysis.ts
import { OpenRouterService } from './openrouter';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { 
  ANALYSIS_PERSPECTIVES, 
  getAnalysisPerspective, 
  formatPerspectiveResponse, 
  createPerspectivePrompt,
  type AnalysisPerspective 
} from './analysis-perspectives';

// Helper function to clean HTML from AI responses
function cleanHtmlFromResponse(content: string): string {
  return content
    // Remove span tags specifically
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    // Remove any other HTML tags
    .replace(/<[^>]+>/g, '')
    // Clean up HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up any extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

interface AnalysisOptions {
  includeOpinion: boolean;
  includeKeyInsights: boolean;
  includeRiskAssessment: boolean;
  includeRecommendations: boolean;
  model?: string; // Model to use for analysis
  apiKey?: string; // API key for the analysis
  perspectives?: string[]; // Which analysis perspectives to use
  perspectiveModels?: Record<string, string>; // Specific models for each perspective
}

interface AnalysisResult {
  opinion: string;
  keyInsights: string[];
  riskAssessment: string;
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
}

export class FinancialAnalysisService {
  private static instance: FinancialAnalysisService;
  private defaultModel: string = 'openai/gpt-4o-mini'; // Default model for analysis
  private activePerspectives: string[] = []; // Currently active analysis perspectives
  private perspectiveModels: Record<string, string> = {}; // Specific models for each perspective
  
  static getInstance(): FinancialAnalysisService {
    if (!FinancialAnalysisService.instance) {
      FinancialAnalysisService.instance = new FinancialAnalysisService();
    }
    return FinancialAnalysisService.instance;
  }

  /**
   * Set the active analysis perspectives
   */
  setActivePerspectives(perspectives: string[]) {
    this.activePerspectives = perspectives;
  }

  /**
   * Get the active analysis perspectives
   */
  getActivePerspectives(): string[] {
    return this.activePerspectives;
  }

  /**
   * Set specific model for a perspective
   */
  setPerspectiveModel(perspectiveId: string, model: string) {
    this.perspectiveModels[perspectiveId] = model;
  }

  /**
   * Get model for a specific perspective
   */
  getPerspectiveModel(perspectiveId: string): string {
    return this.perspectiveModels[perspectiveId] || this.defaultModel;
  }

  /**
   * Set the same model for all perspectives
   */
  setAllPerspectiveModels(model: string) {
    this.activePerspectives.forEach(perspectiveId => {
      this.perspectiveModels[perspectiveId] = model;
    });
  }

  /**
   * Get all perspective model configurations
   */
  getPerspectiveModels(): Record<string, string> {
    return this.perspectiveModels;
  }

  /**
   * Clear all perspective model configurations (revert to default)
   */
  clearPerspectiveModels() {
    this.perspectiveModels = {};
  }

  /**
   * Get all available analysis perspectives
   */
  getAvailablePerspectives(): AnalysisPerspective[] {
    return Object.values(ANALYSIS_PERSPECTIVES);
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
   * Analyzes formatted financial content using LLM
   */
  async analyzeContent(
    formattedContent: string,
    apiKey: string,
    companyName: string,
    options: AnalysisOptions = {
      includeOpinion: true,
      includeKeyInsights: true,
      includeRiskAssessment: true,
      includeRecommendations: true
    }
  ): Promise<string> {
    try {
      // Use LLM-based analysis if API key is provided
      if (apiKey && options.model) {
        return await this.llmAnalysis(formattedContent, apiKey, companyName, options);
      }
      
      // Fallback to enhanced rule-based analysis
      return this.enhancedAnalysis(formattedContent, companyName, options);
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to basic analysis if enhanced analysis fails
      return this.basicAnalysis(formattedContent, companyName);
    }
  }

  /**
   * LLM-based analysis using OpenRouter
   */
  private async llmAnalysis(
    content: string,
    apiKey: string,
    companyName: string,
    options: AnalysisOptions
  ): Promise<string> {
    const model = options.model || this.defaultModel;
    const perspectives = options.perspectives || this.activePerspectives || [];
    
    // If no perspectives are selected, return empty
    if (perspectives.length === 0) {
      return '';
    }

    let combinedAnalysis = '\n\n---\n\n# **Financial Analysis Report**\n\n';
    combinedAnalysis += `*Analysis performed from ${perspectives.length} different perspective${perspectives.length > 1 ? 's' : ''}*\n\n`;

    // Run analysis for each selected perspective
    for (const perspectiveId of perspectives) {
      const perspective = getAnalysisPerspective(perspectiveId);
      
      // Determine which model to use for this perspective
      const perspectiveModel = options.perspectiveModels?.[perspectiveId] || this.perspectiveModels[perspectiveId] || model;
      
      try {
        const basePrompt = `Analyze the following financial information:

${content}

Please provide:
${options.includeOpinion ? '1. Expert Opinion: Your overall assessment of the company\'s financial health and prospects' : ''}
${options.includeKeyInsights ? '2. Key Insights: The most important findings from the data' : ''}
${options.includeRiskAssessment ? '3. Risk Assessment: Major risks and concerns identified' : ''}
${options.includeRecommendations ? '4. Recommendations: Actionable advice for investors or management' : ''}

Format your response with clear sections using markdown headers (##).
Be concise but thorough. Use bullet points for clarity.
Include specific metrics and percentages when discussing financial performance.`;

        const messages = createPerspectivePrompt(basePrompt, perspective, companyName);
        
        const openrouter = OpenRouterService.getInstance();
        const completion = await openrouter.createChatCompletion(messages, perspectiveModel, apiKey);
        
        if (completion) {
          // Clean any HTML from the AI response before formatting
          const cleanedResponse = cleanHtmlFromResponse(completion);
          combinedAnalysis += formatPerspectiveResponse(cleanedResponse, perspective, perspectiveModel);
        }
      } catch (error) {
        console.error(`${perspective.label} analysis error:`, error);
        // Continue with other perspectives even if one fails
      }
    }

    // Add summary section if multiple perspectives
    if (perspectives.length > 1) {
      combinedAnalysis += '\n## **Summary**\n\n';
      combinedAnalysis += `This multi-perspective analysis provides ${perspectives.length} different viewpoints, each offering unique insights based on their specialized focus areas. Consider all perspectives when making investment decisions.\n\n`;
    }

    combinedAnalysis += '---\n\n';
    
    return combinedAnalysis;
  }

  /**
   * Stream LLM analysis for real-time updates
   */
  async *streamAnalysis(
    content: string,
    apiKey: string,
    companyName: string,
    options: AnalysisOptions
  ): AsyncGenerator<string, void, unknown> {
    const model = options.model || this.defaultModel;
    const perspectives = options.perspectives || this.activePerspectives || [];
    
    // If no perspectives are selected, return empty
    if (perspectives.length === 0) {
      return;
    }

    yield '\n\n---\n\n# **Financial Analysis Report**\n\n';
    yield `*Analysis performed from ${perspectives.length} different perspective${perspectives.length > 1 ? 's' : ''}*\n\n`;

    // Stream analysis for each selected perspective
    for (const perspectiveId of perspectives) {
      const perspective = getAnalysisPerspective(perspectiveId);
      
      // Determine which model to use for this perspective
      const perspectiveModel = options.perspectiveModels?.[perspectiveId] || this.perspectiveModels[perspectiveId] || model;
      
      try {
        const basePrompt = `Analyze this financial data:

${content}

Provide: expert opinion, key insights, risk assessment, and recommendations.
Use specific numbers and be concise.`;

        const messages = createPerspectivePrompt(basePrompt, perspective, companyName);
        
        const openrouter = OpenRouterService.getInstance();
        const stream = await openrouter.streamChatCompletion(messages, perspectiveModel, apiKey);
        
        yield `## **${perspective.label}** _(${perspectiveModel})_\n\n`;
        
        let buffer = '';
        for await (const chunk of stream) {
          if (chunk.choices[0]?.delta?.content) {
            buffer += chunk.choices[0].delta.content;
            // Clean HTML from chunks before yielding
            const cleanedChunk = cleanHtmlFromResponse(chunk.choices[0].delta.content);
            yield cleanedChunk;
          }
        }
        
        yield '\n\n---\n\n';
      } catch (error) {
        console.error(`${perspective.label} stream analysis error:`, error);
        // Continue with other perspectives even if one fails
      }
    }

    // Add summary section if multiple perspectives
    if (perspectives.length > 1) {
      yield '\n## **Summary**\n\n';
      yield `This multi-perspective analysis provides ${perspectives.length} different viewpoints, each offering unique insights based on their specialized focus areas. Consider all perspectives when making investment decisions.\n\n`;
    }

    yield '---\n\n';
  }

  /**
   * Enhanced rule-based analysis that provides intelligent insights
   */
  private enhancedAnalysis(content: string, companyName: string, options: AnalysisOptions): string {
    const analysis = this.extractFinancialMetrics(content);
    let result = '';

    if (options.includeOpinion) {
      result += this.generateOpinion(analysis, companyName);
    }

    if (options.includeKeyInsights) {
      result += this.generateKeyInsights(analysis);
    }

    if (options.includeRiskAssessment) {
      result += this.generateRiskAssessment(analysis, content);
    }

    if (options.includeRecommendations) {
      result += this.generateRecommendations(analysis, companyName);
    }

    return result;
  }

  /**
   * Extract financial metrics and trends from content
   */
  private extractFinancialMetrics(content: string) {
    const metrics = {
      revenue: this.extractMetric(content, /revenue.*?(\$[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|thousand|B|M|K))?)/gi),
      growth: this.extractMetric(content, /(?:growth|increase|up).*?(\d+(?:\.\d+)?%)/gi),
      decline: this.extractMetric(content, /(?:decline|decrease|down).*?(\d+(?:\.\d+)?%)/gi),
      margin: this.extractMetric(content, /margin.*?(\d+(?:\.\d+)?%)/gi),
      profit: this.extractMetric(content, /(?:profit|earnings|income).*?(\$[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|thousand|B|M|K))?)/gi),
      eps: this.extractMetric(content, /EPS.*?(\$?[\d.]+)/gi),
      cashFlow: this.extractMetric(content, /cash flow.*?(\$[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|thousand|B|M|K))?)/gi),
      debt: this.extractMetric(content, /debt.*?(\$[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|thousand|B|M|K))?)/gi),
      positiveTerms: this.countTerms(content, ['improved', 'increased', 'growth', 'strong', 'outperformed', 'exceeded', 'beat']),
      negativeTerms: this.countTerms(content, ['declined', 'decreased', 'weak', 'underperformed', 'missed', 'below', 'challenging'])
    };

    return metrics;
  }

  private extractMetric(content: string, regex: RegExp): string[] {
    const matches = content.match(regex) || [];
    return matches.slice(0, 3); // Limit to top 3 matches
  }

  private countTerms(content: string, terms: string[]): number {
    const contentLower = content.toLowerCase();
    return terms.reduce((count, term) => {
      const matches = contentLower.match(new RegExp(`\\b${term}\\b`, 'g'));
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Generate expert opinion based on analysis
   */
  private generateOpinion(analysis: any, companyName: string): string {
    const sentiment = this.calculateSentiment(analysis);
    let opinion = '\n\n---\n\n## **Executive Analysis**\n\n';

    if (sentiment > 0.3) {
      opinion += `> ${companyName} demonstrates strong performance indicators. `;
      if (analysis.growth.length > 0) {
        opinion += `The growth metrics show positive momentum. `;
      }
      if (analysis.margin.length > 0) {
        opinion += `Margin performance indicates effective operational management. `;
      }
      opinion += `Overall, the financial data presents an encouraging outlook.\n\n`;
    } else if (sentiment < -0.3) {
      opinion += `> ${companyName} faces notable challenges based on current metrics. `;
      if (analysis.decline.length > 0) {
        opinion += `Declining indicators warrant careful monitoring and strategic adjustments. `;
      }
      opinion += `A cautious approach is recommended given the current performance trends.\n\n`;
    } else {
      opinion += `> ${companyName} presents mixed performance signals. `;
      opinion += `The data shows both positive developments and areas requiring attention. `;
      opinion += `A balanced assessment suggests selective opportunities alongside specific risks.\n\n`;
    }

    return opinion;
  }

  /**
   * Generate key insights from the analysis
   */
  private generateKeyInsights(analysis: any): string {
    let insights = '### **Key Insights**\n\n';
    const insightsList: string[] = [];

    if (analysis.revenue.length > 0) {
      insightsList.push(`**Revenue Performance**: ${analysis.revenue[0]} - indicates current market position and demand strength`);
    }

    if (analysis.growth.length > 0) {
      const growthValue = analysis.growth[0];
      if (growthValue.includes('+') || parseFloat(growthValue) > 0) {
        insightsList.push(`**Growth Trajectory**: ${growthValue} growth demonstrates positive business momentum`);
      } else {
        insightsList.push(`**Growth Analysis**: ${growthValue} - requires strategic review and potential course correction`);
      }
    }

    if (analysis.margin.length > 0) {
      insightsList.push(`**Profitability Metrics**: ${analysis.margin[0]} margins reflect operational efficiency`);
    }

    if (analysis.positiveTerms > analysis.negativeTerms * 1.5) {
      insightsList.push(`**Management Sentiment**: Notably positive tone (${analysis.positiveTerms} positive indicators) suggests confidence in outlook`);
    } else if (analysis.negativeTerms > analysis.positiveTerms) {
      insightsList.push(`**Risk Disclosure**: Elevated cautionary language (${analysis.negativeTerms} risk mentions) indicates transparency about challenges`);
    }

    if (analysis.cashFlow.length > 0) {
      insightsList.push(`**Cash Flow Position**: ${analysis.cashFlow[0]} - critical indicator of financial health and liquidity`);
    }

    insightsList.forEach(insight => {
      insights += `• ${insight}\n`;
    });

    insights += '\n';
    return insights;
  }

  /**
   * Generate risk assessment
   */
  private generateRiskAssessment(analysis: any, content: string): string {
    let risk = '### **Risk Assessment**\n\n';
    const risks: string[] = [];

    if (analysis.decline.length > 0) {
      risks.push(`**Performance Risk**: Declining metrics (${analysis.decline.join(', ')}) require monitoring`);
    }

    if (analysis.debt.length > 0) {
      risks.push(`**Financial Risk**: Debt levels (${analysis.debt[0]}) should be evaluated against cash generation`);
    }

    if (analysis.negativeTerms > analysis.positiveTerms * 1.5) {
      risks.push(`**Sentiment Risk**: High frequency of negative indicators suggests potential challenges`);
    }

    // Check for specific risk keywords
    const riskKeywords = ['uncertainty', 'volatile', 'pressure', 'challenge', 'risk', 'concern'];
    const riskMentions = riskKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    );

    if (riskMentions.length > 2) {
      risks.push(`**Market Risk**: Multiple risk factors mentioned (${riskMentions.join(', ')})`);
    }

    if (risks.length === 0) {
      risk += '• **Low Risk Profile**: No significant risk indicators identified in current analysis\n';
    } else {
      risks.forEach(riskItem => {
        risk += `• ${riskItem}\n`;
      });
    }

    risk += '\n';
    return risk;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(analysis: any, companyName: string): string {
    let recommendations = '### **Strategic Recommendations**\n\n';
    const recs: string[] = [];

    const sentiment = this.calculateSentiment(analysis);

    if (sentiment > 0.3) {
      recs.push(`**Capitalize on Momentum**: ${companyName} should leverage current positive trends for strategic expansion`);
      recs.push(`**Reinforce Success Factors**: Identify and strengthen the drivers of current performance`);
      recs.push(`**Monitor Leading Indicators**: Establish early warning systems to detect potential trend reversals`);
    } else if (sentiment < -0.3) {
      recs.push(`**Immediate Action Required**: ${companyName} must address performance gaps with urgency`);
      recs.push(`**Risk Mitigation Priority**: Focus on stabilizing core operations before pursuing growth`);
      recs.push(`**Identify Quick Wins**: Target achievable improvements to build momentum`);
    } else {
      recs.push(`**Selective Focus**: Prioritize initiatives with highest impact potential`);
      recs.push(`**Leverage Strengths**: Use successful areas as models for improvement elsewhere`);
      recs.push(`**Performance Tracking**: Implement robust metrics to monitor progress`);
    }

    if (analysis.margin.length > 0) {
      recs.push(`**Margin Protection**: Analyze and preserve the factors driving current profitability`);
    }

    if (analysis.cashFlow.length > 0) {
      recs.push(`**Capital Allocation**: Optimize cash deployment between growth investment and shareholder returns`);
    }

    recs.push(`**Competitive Analysis**: Benchmark against industry peers to identify improvement opportunities`);

    recs.forEach(rec => {
      recommendations += `• ${rec}\n`;
    });

    recommendations += '\n\n**Note**: These recommendations are based on available financial data. Comprehensive due diligence is advised before making investment decisions.\n\n---\n\n';
    return recommendations;
  }

  /**
   * Calculate overall sentiment score
   */
  private calculateSentiment(analysis: any): number {
    let score = 0;
    
    // Positive indicators
    score += analysis.positiveTerms * 0.1;
    score += analysis.growth.length * 0.2;
    score += analysis.revenue.length * 0.1;
    
    // Negative indicators
    score -= analysis.negativeTerms * 0.1;
    score -= analysis.decline.length * 0.2;
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Basic analysis fallback
   */
  private basicAnalysis(content: string, companyName: string): string {
    const hasPositive = /improved|increased|growth|strong|outperformed/i.test(content);
    const hasNegative = /declined|decreased|weak|underperformed/i.test(content);
    
    let analysis = '\n\n---\n\n## **Analysis Summary**\n\n';
    
    if (hasPositive && !hasNegative) {
      analysis += `> **Positive Outlook**: ${companyName} shows encouraging signs in the analyzed metrics.\n\n`;
    } else if (hasNegative && !hasPositive) {
      analysis += `> **Cautious Outlook**: ${companyName} faces some challenges that require attention.\n\n`;
    } else {
      analysis += `> **Mixed Outlook**: ${companyName} presents both opportunities and challenges.\n\n`;
    }
    
    analysis += '### **Key Recommendation**\n\n';
    analysis += '• **Continue Monitoring**: Regular analysis of financial metrics is recommended for informed decision-making\n\n';
    analysis += '---\n\n';
    
    return analysis;
  }

  /**
   * Enhanced quick analysis for real-time streaming with detailed insights
   */
  quickAnalysis(content: string, companyName: string): string {
    const hasFinancialData = /\$[\d,]+|\d+%|revenue|profit|margin|earnings|cash flow/i.test(content);
    if (!hasFinancialData) return '';

    // If no perspectives are active, return empty
    if (this.activePerspectives.length === 0) return '';

    // Use the first active perspective for quick analysis
    const perspective = getAnalysisPerspective(this.activePerspectives[0]);

    // Enhanced pattern matching
    const positivePatterns = /improved|increased|growth|strong|outperformed|exceeded|beat|solid|robust|healthy|expansion|gains/i;
    const negativePatterns = /declined|decreased|weak|underperformed|missed|below|challenging|pressure|concerns|risks|volatility/i;
    const neutralPatterns = /stable|maintained|consistent|steady|flat|unchanged/i;

    const hasPositive = positivePatterns.test(content);
    const hasNegative = negativePatterns.test(content);
    const hasNeutral = neutralPatterns.test(content);

    // Extract key metrics for context
    const revenueMatch = content.match(/revenue.*?(\$[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|B|M))?)/i);
    const growthMatch = content.match(/(?:growth|increase|up).*?(\d+(?:\.\d+)?%)/i);
    const marginMatch = content.match(/margin.*?(\d+(?:\.\d+)?%)/i);

    let analysis = `\n\n---\n\n## **${perspective.label} Quick Take**\n\n`;

    // Sentiment-based analysis with perspective flavor
    if (hasPositive && !hasNegative) {
      analysis += `> **Positive Indicators**: ${companyName} demonstrates **strong performance** metrics. `;
      if (growthMatch) analysis += `Growth of ${growthMatch[1]} suggests **positive momentum**. `;
      if (marginMatch) analysis += `Margin at ${marginMatch[1]} indicates **operational efficiency**. `;
    } else if (hasNegative && !hasPositive) {
      analysis += `> **Caution Warranted**: ${companyName} shows **concerning trends** requiring attention. `;
      analysis += `**Risk assessment** and **strategic review** are recommended. `;
    } else if (hasPositive && hasNegative) {
      analysis += `> **Mixed Performance**: ${companyName} presents **both opportunities and challenges**. `;
      analysis += `**Balanced evaluation** of strengths versus weaknesses is essential. `;
    } else if (hasNeutral) {
      analysis += `> **Stable Metrics**: ${companyName} maintains **consistent performance**. `;
      analysis += `**Continued monitoring** for trend changes is advised. `;
    } else {
      analysis += `> **Data Overview**: Key financial metrics identified for ${companyName}. `;
      analysis += `**Further analysis** recommended for comprehensive insights. `;
    }

    // Add specific metric insights
    if (revenueMatch) {
      analysis += `\n\n**Revenue Analysis**: ${revenueMatch[0]} - Top-line performance indicator of business health.`;
    }

    // Add actionable insight
    analysis += '\n\n**Investment Perspective**: ';
    if (hasPositive && !hasNegative) {
      analysis += 'Consider this as a **potential opportunity** for further research.';
    } else if (hasNegative) {
      analysis += 'Exercise **due diligence** and assess risk tolerance before decisions.';
    } else {
      analysis += 'Maintain **watchlist status** and monitor for trend developments.';
    }

    analysis += '\n\n---\n\n';
    return analysis;
  }
}

// Export singleton instance
export const financialAnalysisService = FinancialAnalysisService.getInstance();
