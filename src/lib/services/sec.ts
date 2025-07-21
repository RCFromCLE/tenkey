// src/lib/services/sec.ts
'use client';

import { useQuery } from '@tanstack/react-query';

interface Filing {
  accessionNumber: string;
  form: string;
  type: '10-K' | '10-Q';
  filingDate: string;
  reportDate: string;
  primaryDocument: string;
  textUrl: string;
  htmlUrl: string;
}

interface SECData {
  cik: string;
  name: string;
  filings: Filing[];
}

export function useSECFilings(ticker: string | undefined) {
  return useQuery<SECData>({
    queryKey: ['secFilings', ticker],
    queryFn: async () => {
      if (!ticker) {
        throw new Error('Ticker is required');
      }
      
      const response = await fetch(`/api/sec?ticker=${encodeURIComponent(ticker)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch SEC filings');
      }
      
      return response.json();
    },
    enabled: Boolean(ticker),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}

export function useFilingContent(url: string | undefined) {
  return useQuery<string>({
    queryKey: ['filingContent', url],
    queryFn: async () => {
      if (!url) {
        throw new Error('URL is required');
      }

      const response = await fetch(`/api/sec?docUrl=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch filing content');
      }

      const data = await response.json();
      return data.content;
    },
    enabled: Boolean(url),
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000
  });
}