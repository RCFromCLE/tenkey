/**
 * Filing optimization utilities for better performance
 */

import type { Filing } from '../types/filing';

// Lightweight filing reference without content
export interface FilingReference {
  accessionNumber: string;
  form: '10-K' | '10-Q';
  filingDate: string;
  reportDate: string;
  symbol: string;
  companyName: string;
  htmlUrl: string;
  textUrl: string;
  primaryDocument: string;
  type: '10-K' | '10-Q';
}

/**
 * Convert a full filing to a lightweight reference
 */
export function toFilingReference(filing: Filing): FilingReference {
  return {
    accessionNumber: filing.accessionNumber,
    form: filing.form,
    filingDate: filing.filingDate,
    reportDate: filing.reportDate,
    symbol: filing.symbol,
    companyName: filing.companyName,
    htmlUrl: filing.htmlUrl,
    textUrl: filing.textUrl,
    primaryDocument: filing.primaryDocument,
    type: filing.type
  };
}

/**
 * Convert filing references back to full filings with content
 */
export function fromFilingReference(reference: FilingReference, content: string): Filing {
  return {
    ...reference,
    content
  };
}

/**
 * Optimize filing array by removing content for UI operations
 */
export function optimizeFilingsForUI(filings: Filing[]): FilingReference[] {
  return filings.map(toFilingReference);
}

/**
 * Check if two filing references are equal (for memoization)
 */
export function areFilingReferencesEqual(a: FilingReference[], b: FilingReference[]): boolean {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i].accessionNumber !== b[i].accessionNumber) return false;
  }
  
  return true;
}

/**
 * Debounced state update for filing operations
 */
export function createDebouncedFilingUpdate<T>(
  updateFn: (value: T) => void,
  delay: number = 100
): (value: T) => void {
  let timeoutId: number | undefined;
  
  return (value: T) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      updateFn(value);
      timeoutId = undefined;
    }, delay);
  };
}
