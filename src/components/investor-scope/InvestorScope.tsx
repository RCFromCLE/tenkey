// src/components/investor-scope/InvestorScope.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Star, Target, 
  BarChart3, PieChart, Activity, DollarSign, Shield, 
  Lightbulb, Award, Eye, Zap, Brain, Sparkles, 
  ArrowUp, ArrowDown, Minus, CheckCircle, XCircle,
  Clock, Calendar, Users, Building, Globe, Briefcase
} from 'lucide-react';

interface InvestorScopeData {
  overallGrade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  overallScore: number;
  confidence: number;
  
  // Core metrics with grades
  financialHealth: {
    grade: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
    metrics: {
      revenue: { value: number; growth: number; grade: string };
      profitability: { value: number; margin: number; grade: string };
      cashFlow: { value: number; strength: string; grade: string };
      debt: { ratio: number; trend: string; grade: string };
    };
  };
  
  businessQuality: {
    grade: string;
    score: number;
    strengths: string[];
    concerns: string[];
    moat: { strength: string; description: string };
  };
  
  growthProspects: {
    grade: string;
    score: number;
    outlook: string;
    catalysts: string[];
    risks: string[];
  };
  
  valuation: {
    grade: string;
    score: number;
    assessment: 'undervalued' | 'fairly_valued' | 'overvalued';
    reasoning: string;
  };
  
  management: {
    grade: string;
    score: number;
    assessment: string;
    highlights: string[];
  };
  
  // Investment thesis
  investmentThesis: {
    bullCase: string[];
    bearCase: string[];
    keyQuestions: string[];
  };
  
  // Recommendations
  recommendation: {
    action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    confidence: number;
    timeHorizon: string;
    priceTarget: number;
    reasoning: string;
  };
  
  // Risk assessment
  riskProfile: {
    overall: 'low' | 'medium' | 'high';
    factors: Array<{
      type: string;
      level: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
  
  // Key insights
  insights: Array<{
    type: 'opportunity' | 'risk' | 'trend' | 'catalyst';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

interface InvestorScopeProps {
  companyName: string;
  symbol: string;
  tenK: any;
  tenQ: any;
  stockPrice?: number;
}

const GradeDisplay = ({ grade, score }: { grade: string; score: number }) => {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (grade.startsWith('B')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (grade.startsWith('C')) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    if (grade.startsWith('D')) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getGradeColor(grade)}`}>
      <span className="text-lg font-bold">{grade}</span>
      <span className="text-sm opacity-80">({score}/100)</span>
    </div>
  );
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <ArrowUp className="w-4 h-4 text-emerald-400" />;
  if (trend === 'down') return <ArrowDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
};

const RecommendationBadge = ({ action, confidence }: { action: string; confidence: number }) => {
  const getActionStyle = (action: string) => {
    switch (action) {
      case 'strong_buy': return 'bg-emerald-600 text-white';
      case 'buy': return 'bg-emerald-500 text-white';
      case 'hold': return 'bg-yellow-500 text-black';
      case 'sell': return 'bg-red-500 text-white';
      case 'strong_sell': return 'bg-red-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getActionText = (action: string) => {
    return action.replace('_', ' ').toUpperCase();
  };

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${getActionStyle(action)}`}>
      <Target className="w-4 h-4" />
      <span>{getActionText(action)}</span>
      <span className="text-sm opacity-80">({confidence}% confidence)</span>
    </div>
  );
};

export function InvestorScope({ companyName, symbol, tenK, tenQ, stockPrice }: InvestorScopeProps) {
  const [data, setData] = useState<InvestorScopeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/investor-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          symbol,
          tenK,
          tenQ,
          stockPrice
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate InvestorScope report');
      }

      const reportData = await response.json();
      setData(reportData);
    } catch (err) {
      console.error('InvestorScope error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenK && tenQ) {
      generateReport();
    }
  }, [tenK, tenQ]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Brain className="w-12 h-12 text-purple-400 animate-pulse" />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">InvestorScope™ Analyzing</h3>
              <p className="text-purple-300">Generating comprehensive investment analysis...</p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/30">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <XCircle className="w-8 h-8 text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Analysis Error</h3>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header with Overall Grade */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Eye className="w-8 h-8 text-purple-400" />
                <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">InvestorScope™</CardTitle>
                <p className="text-purple-300">AI-Powered Investment Analysis</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-purple-300 mb-1">Overall Grade</div>
              <GradeDisplay grade={data.overallGrade} score={data.overallScore} />
              <div className="text-xs text-purple-400 mt-1">
                {data.confidence}% confidence
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <RecommendationBadge 
                action={data.recommendation.action} 
                confidence={data.recommendation.confidence} 
              />
              <div className="text-sm text-slate-300">
                Target: <span className="font-semibold text-white">
                  ${data.recommendation.priceTarget.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              {data.recommendation.timeHorizon}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Financial Health */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Financial Health
              <TrendIcon trend={data.financialHealth.trend} />
            </CardTitle>
            <GradeDisplay grade={data.financialHealth.grade} score={data.financialHealth.score} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-slate-700/50 rounded">
                <div className="text-xs text-slate-400">Revenue</div>
                <div className="font-semibold text-white">
                  ${(data.financialHealth.metrics.revenue.value / 1e9).toFixed(1)}B
                </div>
                <div className={`text-xs ${data.financialHealth.metrics.revenue.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {data.financialHealth.metrics.revenue.growth >= 0 ? '+' : ''}{data.financialHealth.metrics.revenue.growth.toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-2 bg-slate-700/50 rounded">
                <div className="text-xs text-slate-400">Margin</div>
                <div className="font-semibold text-white">
                  {data.financialHealth.metrics.profitability.margin.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-300">
                  {data.financialHealth.metrics.profitability.grade}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Quality */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Building className="w-5 h-5 text-blue-400" />
              Business Quality
            </CardTitle>
            <GradeDisplay grade={data.businessQuality.grade} score={data.businessQuality.score} />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-slate-400 mb-1">Competitive Moat</div>
                <div className="text-sm font-medium text-white">{data.businessQuality.moat.strength}</div>
                <div className="text-xs text-slate-300">{data.businessQuality.moat.description}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Prospects */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Growth Prospects
            </CardTitle>
            <GradeDisplay grade={data.growthProspects.grade} score={data.growthProspects.score} />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-300 mb-3">{data.growthProspects.outlook}</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-emerald-400 font-medium">Key Catalysts</div>
                <ul className="text-xs text-slate-300 space-y-1">
                  {data.growthProspects.catalysts.slice(0, 2).map((catalyst, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      {catalyst}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Thesis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-emerald-900/20 border-emerald-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              Bull Case
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.investmentThesis.bullCase.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                  <ArrowUp className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-red-900/20 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Bear Case
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.investmentThesis.bearCase.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                  <ArrowDown className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.insights.map((insight, i) => (
              <div key={i} className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {insight.type === 'opportunity' && <Target className="w-4 h-4 text-emerald-400" />}
                  {insight.type === 'risk' && <Shield className="w-4 h-4 text-red-400" />}
                  {insight.type === 'trend' && <Activity className="w-4 h-4 text-blue-400" />}
                  {insight.type === 'catalyst' && <Zap className="w-4 h-4 text-yellow-400" />}
                  <span className="text-sm font-medium text-white capitalize">{insight.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    insight.impact === 'high' ? 'bg-red-500/20 text-red-300' :
                    insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {insight.impact}
                  </span>
                </div>
                <div className="text-sm font-medium text-white mb-1">{insight.title}</div>
                <div className="text-xs text-slate-300">{insight.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Profile */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-orange-400" />
            Risk Assessment
            <span className={`text-sm px-2 py-1 rounded ${
              data.riskProfile.overall === 'low' ? 'bg-green-500/20 text-green-300' :
              data.riskProfile.overall === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }`}>
              {data.riskProfile.overall.toUpperCase()} RISK
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.riskProfile.factors.map((factor, i) => (
              <div key={i} className="p-3 bg-slate-700/50 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{factor.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    factor.level === 'low' ? 'bg-green-500/20 text-green-300' :
                    factor.level === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {factor.level}
                  </span>
                </div>
                <div className="text-xs text-slate-300">{factor.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Summary */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/40">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-2">Investment Recommendation</div>
            <div className="text-sm text-purple-300 max-w-3xl mx-auto">
              {data.recommendation.reasoning}
            </div>
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {data.recommendation.timeHorizon}
              </div>
              <div className="flex items-center gap-1">
                <Brain className="w-4 h-4" />
                AI Confidence: {data.confidence}%
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Generated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InvestorScope;
