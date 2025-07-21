// src/components/report/CompanyReport.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Download } from 'lucide-react';
import { PDFExporter } from '../../lib/utils/pdf-export';

interface CompanyReportProps {
  report: any;
  metadata: {
    company: string;
    generated: string;
    sources: {
      tenK: string;
      tenQ: string;
    };
  };
}

const MetricCard = ({ title, value, trend, significance }: any) => {
  const isPositive = trend?.toLowerCase().includes('up') || trend?.toLowerCase().includes('positive');
  
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-400">{title}</p>
          {trend && (
            <span className={`flex items-center text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend}
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{value}</h3>
        {significance && (
          <p className="text-sm text-gray-400">{significance}</p>
        )}
      </CardContent>
    </Card>
  );
};

const CompanyReport: React.FC<CompanyReportProps> = ({ report, metadata }) => {
  const handleExportPDF = async () => {
    try {
      await PDFExporter.exportReportToPDF(
        'company-report-container',
        `${metadata.company.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        {
          format: 'letter',
          orientation: 'portrait'
        }
      );
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  return (
    <div id="company-report-container" className="space-y-8 max-w-7xl mx-auto p-6 print:p-0">
      {/* Header */}
      <div className="text-center mb-8 print:mb-6 relative">
        <button
          onClick={handleExportPDF}
          className="absolute right-0 top-0 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
          title="Export report to PDF"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">{metadata.company}</h1>
        <p className="text-gray-400">Comprehensive Analysis Report</p>
        <p className="text-sm text-gray-500 mt-2">
          Generated on {new Date(metadata.generated).toLocaleDateString()}
        </p>
        <div className="text-sm text-gray-500 mt-1">
          Based on 10-K ({metadata.sources.tenK}) and 10-Q ({metadata.sources.tenQ})
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300">{report.overview.summary}</p>
            <div className="mt-6">
              <h4 className="text-lg font-medium text-white mb-3">Key Highlights</h4>
              <ul className="space-y-2">
                {report.overview.highlights.map((highlight: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span className="text-gray-300">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <h4 className="text-lg font-medium text-white mb-3">Outlook</h4>
              <p className="text-gray-300">{report.overview.outlook}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Analysis */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            Financial Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Performance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  title="Revenue"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(report.financialAnalysis.performance.revenue.current)}
                  trend={report.financialAnalysis.performance.revenue.growth}
                  significance={report.financialAnalysis.performance.revenue.analysis}
                />
                <MetricCard
                  title="Net Income"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(report.financialAnalysis.performance.profitability.netIncome.current)}
                  trend={report.financialAnalysis.performance.profitability.netIncome.growth}
                  significance={report.financialAnalysis.performance.profitability.analysis}
                />
                <MetricCard
                  title="Operating Cash Flow"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(report.financialAnalysis.performance.cashFlow.operating)}
                  significance={report.financialAnalysis.performance.cashFlow.analysis}
                />
              </div>
            </div>

            {/* Key Metrics */}
            <div className="mt-8">
              <h4 className="text-lg font-medium text-white mb-4">Key Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.financialAnalysis.keyMetrics.map((metric: any, index: number) => (
                  <MetricCard
                    key={index}
                    title={metric.name}
                    value={metric.value}
                    trend={metric.trend}
                    significance={metric.significance}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Analysis */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            Business Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Business Model</h4>
              <p className="text-gray-300">{report.businessAnalysis.model}</p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Strategy</h4>
              <p className="text-gray-300">{report.businessAnalysis.strategy}</p>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-4">SWOT Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-900/20 border-gray-900/20">
                  <CardContent className="p-4">
                    <h5 className="font-medium text-gray-400 mb-2">Strengths</h5>
                    <ul className="space-y-1">
                      {report.businessAnalysis.competitive.strengths.map((item: string, i: number) => (
                        <li key={i} className="text-gray-300 flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/20 border-gray-900/20">
                  <CardContent className="p-4">
                    <h5 className="font-medium text-gray-400 mb-2">Weaknesses</h5>
                    <ul className="space-y-1">
                      {report.businessAnalysis.competitive.weaknesses.map((item: string, i: number) => (
                        <li key={i} className="text-gray-300 flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/20 border-gray-900/20">
                  <CardContent className="p-4">
                    <h5 className="font-medium text-gray-400 mb-2">Opportunities</h5>
                    <ul className="space-y-1">
                      {report.businessAnalysis.competitive.opportunities.map((item: string, i: number) => (
                        <li key={i} className="text-gray-300 flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/20 border-gray-900/20">
                  <CardContent className="p-4">
                    <h5 className="font-medium text-gray-400 mb-2">Threats</h5>
                    <ul className="space-y-1">
                      {report.businessAnalysis.competitive.threats.map((item: string, i: number) => (
                        <li key={i} className="text-gray-300 flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-gray-300">{report.riskAssessment.summary}</p>
            
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Key Risks</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {report.riskAssessment.keyRisks.map((risk: any, index: number) => (
                  <Card key={index} className="bg-red-900/20 border-red-900/20">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <span className="text-xs font-medium text-red-400/80 uppercase tracking-wider">
                          {risk.category}
                        </span>
                        <p className="text-gray-300 mt-1">{risk.description}</p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-red-900/20">
                        <p className="text-sm">
                          <span className="text-red-400">Impact:</span>
                          <span className="text-gray-300 ml-2">{risk.potential_impact}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-green-400">Mitigation:</span>
                          <span className="text-gray-300 ml-2">{risk.mitigation}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-3">Risk Trends</h4>
              <p className="text-gray-300">{report.riskAssessment.riskTrends}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Position */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            Market Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Industry Overview</h4>
              <p className="text-gray-300">{report.marketPosition.industry}</p>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-3">Competitive Landscape</h4>
              <p className="text-gray-300">{report.marketPosition.competition}</p>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-3">Market Share</h4>
              <p className="text-gray-300">{report.marketPosition.marketShare}</p>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-4">Key Trends</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.marketPosition.trends.map((trend: any, index: number) => (
                  <Card key={index} className="bg-blue-900/20 border-blue-900/20">
                    <CardContent className="p-4">
                      <h5 className="font-medium text-blue-400 mb-2">{trend.name}</h5>
                      <p className="text-gray-300 mb-3">{trend.impact}</p>
                      <p className="text-sm text-blue-300">Response: {trend.response}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            Key Takeaways & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-400 mb-3">Key Strengths</h4>
              <ul className="space-y-2">
                {report.recommendations.strengths.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-400 mb-3">Areas of Concern</h4>
              <ul className="space-y-2">
                {report.recommendations.concerns.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-400 mb-3">Growth Opportunities</h4>
              <ul className="space-y-2">
                {report.recommendations.opportunities.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-400 mb-3">Watch Points</h4>
              <ul className="space-y-2">
                {report.recommendations.watchPoints.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8 print:mt-4">
        <p>Generated by TenKey AI • {new Date(metadata.generated).toLocaleString()}</p>
        <p className="mt-1">Based on SEC Filings Analysis</p>
      </div>
    </div>
  );
};

export default CompanyReport;
