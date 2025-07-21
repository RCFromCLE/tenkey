import React from 'react';
import type { StockInfo } from '@/lib/types/filing-chat';

interface StockInfoPanelProps {
  stockInfo: StockInfo;
}

/**
 * StockInfoPanel component for displaying detailed stock metrics
 * in the control panel sidebar.
 */
export function StockInfoPanel({ stockInfo }: StockInfoPanelProps) {
  // Check if we have any extended stock info to display
  const hasExtendedInfo = stockInfo.previousClose || stockInfo.open || stockInfo.bid || 
                         stockInfo.ask || stockInfo.yearRange || stockInfo.eps || 
                         stockInfo.pe || stockInfo.dividend || stockInfo.beta;
  
  // Don't render the panel if we only have basic info (price, change, changePercent)
  if (!hasExtendedInfo) {
    return null;
  }
  
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-200 mb-3">Stock Information</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {stockInfo.previousClose && (
          <div className="flex justify-between">
            <span className="text-slate-400">Prev Close</span>
            <span className="text-slate-200">${stockInfo.previousClose}</span>
          </div>
        )}
        {stockInfo.open && (
          <div className="flex justify-between">
            <span className="text-slate-400">Open</span>
            <span className="text-slate-200">${stockInfo.open}</span>
          </div>
        )}
        {stockInfo.bid && (
          <div className="flex justify-between">
            <span className="text-slate-400">Bid</span>
            <span className="text-slate-200">{stockInfo.bid}</span>
          </div>
        )}
        {stockInfo.ask && (
          <div className="flex justify-between">
            <span className="text-slate-400">Ask</span>
            <span className="text-slate-200">{stockInfo.ask}</span>
          </div>
        )}
        {stockInfo.yearRange && (
          <div className="flex justify-between col-span-2">
            <span className="text-slate-400">52W Range</span>
            <span className="text-slate-200">{stockInfo.yearRange}</span>
          </div>
        )}
        {stockInfo.eps && (
          <div className="flex justify-between">
            <span className="text-slate-400">EPS</span>
            <span className="text-slate-200">{stockInfo.eps}</span>
          </div>
        )}
        {stockInfo.pe && (
          <div className="flex justify-between">
            <span className="text-slate-400">P/E</span>
            <span className="text-slate-200">{stockInfo.pe}</span>
          </div>
        )}
        {stockInfo.dividend && (
          <div className="flex justify-between">
            <span className="text-slate-400">Dividend</span>
            <span className="text-slate-200">{stockInfo.dividend}</span>
          </div>
        )}
        {stockInfo.beta && (
          <div className="flex justify-between">
            <span className="text-slate-400">Beta</span>
            <span className="text-slate-200">{stockInfo.beta}</span>
          </div>
        )}
      </div>
    </div>
  );
}
