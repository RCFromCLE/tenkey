import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StockInfo } from '@/lib/types/filing-chat';

interface StockInfoDisplayProps {
  companyName: string;
  symbol: string;
  stockInfo?: StockInfo;
}

/**
 * StockInfoDisplay component for showing stock price and basic metrics
 * in the chat header area.
 */
export function StockInfoDisplay({ companyName, symbol, stockInfo }: StockInfoDisplayProps) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-lg font-bold text-white">
        {companyName} ({symbol})
      </h2>
      
      {stockInfo && (
        <div className="flex items-center gap-4">
          {/* Current Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-white">${stockInfo.price}</span>
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium",
              stockInfo.change && stockInfo.change.startsWith('-') 
                ? "bg-red-500/20 text-red-400" 
                : "bg-green-500/20 text-green-400"
            )}>
              <span>{stockInfo.change && !stockInfo.change.startsWith('-') ? '+' : ''}{stockInfo.change || '0.00'}</span>
              <span>({stockInfo.changePercent || '0.00%'})</span>
            </div>
          </div>
          
          {/* Additional Stock Info */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {stockInfo.dayRange && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Day Range:</span>
                <span className="text-slate-300">{stockInfo.dayRange}</span>
              </div>
            )}
            {stockInfo.volume && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Vol:</span>
                <span className="text-slate-300">{stockInfo.volume}</span>
              </div>
            )}
            {stockInfo.marketCap && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Mkt Cap:</span>
                <span className="text-slate-300">{stockInfo.marketCap}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <a
        href={`https://finance.yahoo.com/quote/${symbol}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-blue-400 hover:underline ml-auto"
      >
        Yahoo Finance <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
