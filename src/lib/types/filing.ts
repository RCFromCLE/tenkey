// src/lib/types/filing.ts
export interface SECFiling {
    form: '10-K' | '10-Q';
    type: '10-K' | '10-Q';
    filingDate: string;
    reportDate: string;
    accessionNumber: string;
    primaryDocument: string;
    textUrl: string;
    htmlUrl: string;
    symbol: string;
}
 
export interface Filing extends SECFiling {
    content: string;
    companyName: string;
}

export interface FilingAnalysis {
    revenue: number;
    previousRevenue?: number;
    revenueTrend?: string;
    netIncome: number;
    previousNetIncome?: number;
    incomeTrend?: string;
    cashFlow: number;
    previousCashFlow?: number;
    cashFlowTrend?: string;
    segments: Array<{
      name: string;
      value: number;
      percentage: number;
      description?: string;
    }>;
    risks: Array<{
      title: string;
      description: string;
      impact?: string;
    }>;
    keyTakeaways: string[];
}

// New interface for FilingChat props
export interface FilingChatProps {
    filing: Filing;
    companyName?: string;
    userId: string;
    onFilingChange: (filing: Filing) => void;
    filings: SECFiling[];
    onFilingSelect: (filing: SECFiling) => void;
    isLoadingFiling: boolean;
}
