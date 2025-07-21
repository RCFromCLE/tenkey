// src/lib/types/filing-summary.ts

export interface FinancialSegment {
  name: string;
  amount: number;
  growth: string;
}

export interface RevenueData {
  total: number;
  growth: string;
  segments: FinancialSegment[];
}

export interface OperatingIncomeData {
  total: number;
  growth: string;
  segments: FinancialSegment[];
}

export interface KeyMetric {
  name: string;
  growth: string;
  details?: string;
}

export interface BusinessSegment {
  name: string;
  revenue: number;
  growth: string;
  contribution: string;
  highlights: string[];
}

export interface BusinessTrend {
  name: string;
  description: string;
  impact: string;
}

export interface Risk {
  category: string;
  title: string;
  description: string;
  potentialImpact: string;
  mitigationEfforts?: string;
  timeframe?: string;
}

export interface FilingAnalysis {
  revenue: RevenueData;
  operatingIncome: OperatingIncomeData;
  keyMetrics: KeyMetric[];
  mainSegments: BusinessSegment[];
  trends: BusinessTrend[];
  operationalRisks: Risk[];
  marketRisks: Risk[];
  emergingRisks: Risk[];
  summary: {
    financial: string;
    segments: string;
    risks: string;
  };
}

export interface MetricCardProps {
  title: string;
  value: number;
  growth: string;
  details?: string;
  className?: string;
}

export interface FilingSummaryProps {
  filing: {
    content: string;
    type: string;
    filingDate: string;
    accessionNumber?: string;
    cik?: string;
  };
  companyName: string;
}
