// src/components/filing/FilingSummary.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowUpRight, ArrowDownRight, AlertTriangle, TrendingUp, Loader2, BarChart3, Lightbulb } from 'lucide-react';
import type { FilingAnalysis, MetricCardProps, FilingSummaryProps, BusinessSegment, Risk, BusinessTrend } from '../../lib/types/filing-summary';

const MetricCard: React.FC<MetricCardProps> = ({ title, value, growth, details, className = '' }) => {
  const isPositiveGrowth = growth?.includes('up');
  
  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-400">{title}</p>
          {growth && (
            <span className={`flex items-center text-sm ${isPositiveGrowth ? 'text-green-400' : 'text-red-400'}`}>
              {isPositiveGrowth ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
              {growth}
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold text-white">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value)}
        </h3>
        {details && (
          <p className="text-sm text-gray-400 mt-2">{details}</p>
        )}
      </CardContent>
    </Card>
  );
};

const SegmentSection: React.FC<{ segments: BusinessSegment[]; trends: BusinessTrend[]; summary: string }> = ({ segments, trends, summary }) => (
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-white">
        <BarChart3 className="w-5 h-5" />
        Business Segments
      </CardTitle>
      <p className="text-sm text-gray-400 mt-2">{summary}</p>
    </CardHeader>
    <CardContent>
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {segments.map((segment, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-white">{segment.name}</h4>
                  <span className={`text-sm ${segment.growth.includes('up') ? 'text-green-400' : 'text-red-400'}`}>
                    {segment.growth}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(segment.revenue)}
                  </p>
                  <p className="text-sm text-gray-400">{segment.contribution}</p>
                  <ul className="mt-3 space-y-1">
                    {segment.highlights.map((highlight, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {trends.length > 0 && (
          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              Key Trends
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trends.map((trend, index) => (
                <div key={index} className="space-y-2">
                  <h5 className="text-sm font-medium text-white">{trend.name}</h5>
                  <p className="text-sm text-gray-400">{trend.description}</p>
                  <p className="text-sm text-blue-400">{trend.impact}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const RiskSection: React.FC<{ risks: { operational: Risk[]; market: Risk[]; emerging: Risk[] }; summary: string }> = ({ risks, summary }) => (
  <Card className="bg-red-900/10 border-red-900/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-400">
        <AlertTriangle className="w-5 h-5" />
        Key Risk Factors
      </CardTitle>
      <p className="text-sm text-gray-400 mt-2">{summary}</p>
    </CardHeader>
    <CardContent>
      <div className="space-y-8">
        {Object.entries(risks).map(([type, riskList]) => riskList.length > 0 && (
          <div key={type} className="space-y-4">
            <h4 className="text-lg font-medium text-white capitalize">{type} Risks</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {riskList.map((risk, index) => (
                <Card key={index} className="bg-red-900/20 border-red-800/20">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <span className="text-xs font-medium text-red-400/80 uppercase tracking-wider">
                        {risk.category}
                      </span>
                      <h5 className="text-sm font-medium text-white mt-1">{risk.title}</h5>
                    </div>
                    <p className="text-sm text-gray-400">{risk.description}</p>
                    <div className="space-y-2 pt-2 border-t border-red-900/20">
                      <p className="text-sm">
                        <span className="text-red-400">Impact:</span>
                        <span className="text-gray-300 ml-2">{risk.potentialImpact}</span>
                      </p>
                      {risk.mitigationEfforts && (
                        <p className="text-sm">
                          <span className="text-green-400">Mitigation:</span>
                          <span className="text-gray-300 ml-2">{risk.mitigationEfforts}</span>
                        </p>
                      )}
                      {risk.timeframe && (
                        <p className="text-sm">
                          <span className="text-blue-400">Timeframe:</span>
                          <span className="text-gray-300 ml-2">{risk.timeframe}</span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const FilingSummary: React.FC<FilingSummaryProps> = ({ filing, companyName }) => {
  const [analysis, setAnalysis] = useState<FilingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!filing?.content) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/filing-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filing: {
              content: filing.content,
              type: filing.type,
              filingDate: filing.filingDate,
              accessionNumber: filing.accessionNumber
            },
            companyId: filing.cik || 'unknown'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to analyze filing');
        }

        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        console.error('Analysis error:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze filing');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [filing]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-gray-400">Analyzing filing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/10 border-red-900/20">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Analysis Error</h3>
              <p className="text-gray-400">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-8">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Financial Overview</CardTitle>
          <p className="text-sm text-gray-400 mt-2">{analysis.summary.financial}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Revenue"
              value={analysis.revenue.total}
              growth={analysis.revenue.growth}
            />
            <MetricCard
              title="Operating Income"
              value={analysis.operatingIncome.total}
              growth={analysis.operatingIncome.growth}
            />
            {analysis.keyMetrics.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.name}
                value={parseFloat(metric.growth.match(/\d+/)?.[0] || '0')}
                growth={metric.growth}
                details={metric.details}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <SegmentSection
        segments={analysis.mainSegments}
        trends={analysis.trends}
        summary={analysis.summary.segments}
      />

      <RiskSection
        risks={{
          operational: analysis.operationalRisks,
          market: analysis.marketRisks,
          emerging: analysis.emergingRisks
        }}
        summary={analysis.summary.risks}
      />
    </div>
  );
};

export default FilingSummary;
