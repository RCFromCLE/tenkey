// src/app/company/[symbol]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FilingChatAdapter as FilingChat } from '../../../components/filing/FilingChatAdapter';
import CompanyReport from '../../../components/report/CompanyReport';
import InvestorScope from '../../../components/investor-scope/InvestorScope';
import { Loader2, Bot, Sparkles, ArrowRight, FileText, ChevronDown, FileBarChart, Eye } from 'lucide-react';
import Link from 'next/link';
import type { Filing, SECFiling } from '../../../lib/types/filing';
import { useSECFilings, useFilingContent } from '../../../lib/services/sec';

interface StockInfo {
  price: string;
  change: string;
  changePercent: string;
  dayRange?: string;
  volume?: string;
  marketCap?: string;
  previousClose?: string;
  open?: string;
  bid?: string;
  ask?: string;
  yearRange?: string;
  eps?: string;
  pe?: string;
  dividend?: string;
  beta?: string;
}

interface SECData {
  cik: string;
  name: string;
  filings: SECFiling[];
}

const TenkeyLogo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="transition-transform duration-300"
  >
    <defs>
      <linearGradient 
        id="headerLogoGradient" 
        x1="0" 
        y1="0" 
        x2="28" 
        y2="28" 
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#0EA5E9" />
      </linearGradient>
    </defs>
    <path
      d="M14 4L24 9.5V18.5L14 24L4 18.5V9.5L14 4Z"
      fill="#0F172A"
      stroke="url(#headerLogoGradient)"
      strokeWidth="1.5"
    />
    <path
      d="M10 8H18M14 8V20"
      stroke="url(#headerLogoGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function CompanyPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbol = params.symbol as string;
  const chatId = searchParams.get('chatId');

  const [selectedFiling, setSelectedFiling] = useState<Filing | null>(null);
  const [loadingFiling, setLoadingFiling] = useState(false);
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [showFilingList, setShowFilingList] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [showInvestorScope, setShowInvestorScope] = useState(false);

  // Fetch SEC filings data
  const {
    data: secData,
    isLoading: isSecLoading,
    error: secError
  } = useSECFilings(symbol);

  // Handle filing selection
  const handleFilingSelect = async (filing: SECFiling) => {
    try {
      setLoadingFiling(true);
      const response = await fetch(`/api/sec?docUrl=${encodeURIComponent(filing.textUrl)}`);
      if (!response.ok) throw new Error('Failed to fetch filing content');

      const { content } = await response.json();
      
      const newFiling: Filing = {
        ...filing,
        content,
        companyName: secData?.name || '',
        type: filing.form,
        symbol: symbol.toUpperCase()
      };
      
      setSelectedFiling(newFiling);
      setShowFilingList(false);
    } catch (err) {
      console.error('Error fetching filing:', err);
    } finally {
      setLoadingFiling(false);
    }
  };

  // Handle filing change
  const handleFilingChange = (newFiling: Filing) => {
    if (!selectedFiling) return;
    
    const updatedFiling: Filing = {
      ...selectedFiling,
      ...newFiling,
      form: newFiling.form,
      type: newFiling.form,
      reportDate: newFiling.reportDate || selectedFiling?.reportDate || newFiling.filingDate,
      primaryDocument: newFiling.primaryDocument || selectedFiling?.primaryDocument || '',
      htmlUrl: newFiling.htmlUrl || selectedFiling?.htmlUrl || '',
      companyName: newFiling.companyName || secData?.name || '',
      symbol: symbol.toUpperCase()
    };
    
    setSelectedFiling(updatedFiling);
  };

  // Fetch stock price info
  useEffect(() => {
    const fetchStockInfo = async () => {
      try {
        const response = await fetch(`/api/yahoo?symbol=${symbol}&mode=quote`);
        if (response.ok) {
          const data = await response.json();
          setStockInfo({
            price: data.price,
            change: data.change || '0.00',
            changePercent: data.changePercent || '0.00%',
            dayRange: data.dayRange,
            volume: data.volume,
            marketCap: data.marketCap,
            previousClose: data.previousClose,
            open: data.open,
            bid: data.bid,
            ask: data.ask,
            yearRange: data.yearRange,
            eps: data.eps,
            pe: data.pe,
            dividend: data.dividend,
            beta: data.beta
          });
        }
      } catch (error) {
        console.error('Failed to fetch stock info:', error);
      }
    };

    if (symbol) {
      fetchStockInfo();
      const interval = setInterval(fetchStockInfo, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [symbol]);

  // Auto-select first filing
  useEffect(() => {
    if (secData?.filings?.[0] && !selectedFiling && !loadingFiling) {
      const firstFiling = secData.filings[0];
      if (firstFiling.form === '10-K' || firstFiling.form === '10-Q') {
        const filing: SECFiling = {
          ...firstFiling,
          form: firstFiling.form as '10-K' | '10-Q',
          type: firstFiling.form as '10-K' | '10-Q',
          symbol: symbol.toUpperCase()
        };
        void handleFilingSelect(filing);
      }
    }
  }, [secData, selectedFiling, loadingFiling, symbol]);

  // Generate comprehensive report
  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      
      // Find latest 10-K and 10-Q
      const tenK = secData?.filings.find(f => f.form === '10-K');
      const tenQ = secData?.filings.find(f => f.form === '10-Q');
      
      if (!tenK || !tenQ) {
        throw new Error('Both 10-K and 10-Q filings are required');
      }

      // Fetch content for both filings
      const [tenKContent, tenQContent] = await Promise.all([
        fetch(`/api/sec?docUrl=${encodeURIComponent(tenK.textUrl)}`).then(r => r.json()),
        fetch(`/api/sec?docUrl=${encodeURIComponent(tenQ.textUrl)}`).then(r => r.json())
      ]);

      // Generate report
      const response = await fetch('/api/company-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: secData?.name,
          tenK: {
            content: tenKContent.content,
            filingDate: tenK.filingDate,
            type: tenK.form
          },
          tenQ: {
            content: tenQContent.content,
            filingDate: tenQ.filingDate,
            type: tenQ.form
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const reportData = await response.json();
      setReport(reportData);
      
      // Open report in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        // Create a complete HTML document with embedded report data and styles
        const reportHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${secData?.name} - Company Report</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                /* Base styles */
                body {
                  font-family: system-ui, -apple-system, sans-serif;
                  line-height: 1.5;
                  margin: 0;
                  padding: 2rem;
                  background: white;
                  color: black;
                }
                
                /* Report sections */
                .section {
                  margin-bottom: 2rem;
                  break-inside: avoid;
                }
                
                .section-title {
                  font-size: 1.5rem;
                  font-weight: 600;
                  margin-bottom: 1rem;
                  color: #1a1a1a;
                }
                
                /* Metrics */
                .metrics-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 1rem;
                  margin-bottom: 1.5rem;
                }
                
                .metric-card {
                  padding: 1rem;
                  border: 1px solid #e5e5e5;
                  border-radius: 0.5rem;
                }
                
                .metric-title {
                  font-size: 0.875rem;
                  color: #666;
                  margin-bottom: 0.5rem;
                }
                
                .metric-value {
                  font-size: 1.25rem;
                  font-weight: 600;
                  color: #1a1a1a;
                }
                
                /* Lists */
                .list-item {
                  margin-bottom: 0.75rem;
                  padding-left: 1.5rem;
                  position: relative;
                }
                
                .list-item:before {
                  content: "•";
                  position: absolute;
                  left: 0.5rem;
                  color: #666;
                }
                
                /* Tables */
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 1.5rem;
                }
                
                th, td {
                  padding: 0.75rem;
                  border: 1px solid #e5e5e5;
                  text-align: left;
                }
                
                th {
                  background: #f5f5f5;
                  font-weight: 600;
                }
                
                /* Print specific styles */
                @media print {
                  @page {
                    margin: 1.5cm;
                    size: A4;
                  }
                  
                  body {
                    padding: 0;
                  }
                  
                  .section {
                    page-break-inside: avoid;
                  }
                }
              </style>
            </head>
            <body>
              <div class="report">
                <!-- Header -->
                <div class="section">
                  <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">${reportData.metadata.company}</h1>
                  <p style="color: #666;">Comprehensive Analysis Report</p>
                  <p style="color: #666; font-size: 0.875rem;">
                    Generated on ${new Date(reportData.metadata.generated).toLocaleDateString()}
                  </p>
                  <p style="color: #666; font-size: 0.875rem;">
                    Based on 10-K (${reportData.metadata.sources.tenK}) and 10-Q (${reportData.metadata.sources.tenQ})
                  </p>
                </div>

                <!-- Overview -->
                <div class="section">
                  <h2 class="section-title">Executive Summary</h2>
                  <p>${reportData.report.overview.summary}</p>
                  <div style="margin-top: 1.5rem;">
                    <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">Key Highlights</h3>
                    <ul style="list-style: none; padding: 0;">
                      ${reportData.report.overview.highlights.map((highlight: string) => `
                        <li class="list-item">${highlight}</li>
                      `).join('')}
                    </ul>
                  </div>
                  <div style="margin-top: 1.5rem;">
                    <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">Outlook</h3>
                    <p>${reportData.report.overview.outlook}</p>
                  </div>
                </div>

                <!-- Financial Analysis -->
                <div class="section">
                  <h2 class="section-title">Financial Analysis</h2>
                  <div class="metrics-grid">
                    <div class="metric-card">
                      <div class="metric-title">Revenue</div>
                      <div class="metric-value">
                        ${new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          notation: 'compact',
                          maximumFractionDigits: 1
                        }).format(reportData.report.financialAnalysis.performance.revenue.current)}
                      </div>
                      <div style="color: ${reportData.report.financialAnalysis.performance.revenue.growth.includes('up') ? '#22c55e' : '#ef4444'}; font-size: 0.875rem;">
                        ${reportData.report.financialAnalysis.performance.revenue.growth}
                      </div>
                    </div>
                    <!-- Add more metrics here -->
                  </div>
                  <p>${reportData.report.financialAnalysis.summary}</p>
                </div>

                <!-- Business Analysis -->
                <div class="section">
                  <h2 class="section-title">Business Analysis</h2>
                  <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">Business Model</h3>
                    <p>${reportData.report.businessAnalysis.model}</p>
                  </div>
                  <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">Strategy</h3>
                    <p>${reportData.report.businessAnalysis.strategy}</p>
                  </div>
                </div>

                <!-- Risk Assessment -->
                <div class="section">
                  <h2 class="section-title">Risk Assessment</h2>
                  <p>${reportData.report.riskAssessment.summary}</p>
                  <div style="margin-top: 1.5rem;">
                    <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">Key Risks</h3>
                    ${reportData.report.riskAssessment.keyRisks.map((risk: any) => `
                      <div style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                        <div style="font-size: 0.75rem; color: #666; text-transform: uppercase;">${risk.category}</div>
                        <div style="font-weight: 500; margin: 0.5rem 0;">${risk.description}</div>
                        <div style="font-size: 0.875rem;">
                          <span style="color: #666;">Impact:</span>
                          <span style="margin-left: 0.5rem;">${risk.potential_impact}</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- Footer -->
                <div style="margin-top: 3rem; text-align: center; color: #666; font-size: 0.875rem;">
                  <p>Generated by TenKey AI • ${new Date(reportData.metadata.generated).toLocaleString()}</p>
                  <p>Based on SEC Filings Analysis</p>
                </div>
              </div>
              <script>
                window.onload = () => {
                  window.print();
                };
              </script>
            </body>
          </html>
        `;
        
        printWindow.document.write(reportHtml);
        printWindow.document.close();
      }

    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (status === 'loading' || isSecLoading || !status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0E14]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400/90" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Prepare filings with required properties and proper typing
  const filingsWithSymbol: Filing[] = secData?.filings
    .filter(filing => filing.form === '10-K' || filing.form === '10-Q')
    .map(filing => ({
      ...filing,
      form: filing.form as '10-K' | '10-Q',
      type: filing.form as '10-K' | '10-Q',
      symbol: symbol.toUpperCase(),
      content: '', // Empty content for list items
      companyName: secData.name || '' // Company name from secData
    })) || [];

  return (
    <div className="flex flex-col h-screen bg-[#0B0E14] pt-28">
      {/* Main Content Area */}
      <div className="flex-1 h-full">
          {showInvestorScope ? (
            <InvestorScope 
              symbol={symbol.toUpperCase()}
              companyName={secData?.name || ''}
              tenK={secData?.filings.find(f => f.form === '10-K') || null}
              tenQ={secData?.filings.find(f => f.form === '10-Q') || null}
            />
          ) : (
            selectedFiling && session?.user?.id && (
              <FilingChat 
                filing={selectedFiling}
                companyName={secData?.name}
                userId={session.user.id}
                onFilingChange={handleFilingChange}
                filings={filingsWithSymbol}
                onFilingSelect={handleFilingSelect}
                isLoadingFiling={loadingFiling}
                initialChatId={chatId ?? undefined}
                stockInfo={stockInfo || undefined}
              />
            )
          )}
        </div>
    </div>
  );
}
