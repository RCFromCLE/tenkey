/**
 * ChatHeader Component
 * Displays company name, stock ticker, and stock information in the chat header
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StockInfo {
  price: string;
  change: string;
  changePercent: string;
  dayRange?: string;
  volume?: string;
  marketCap?: string;
}

interface ChatHeaderProps {
  companyName: string;
  symbol: string;
  stockInfo?: StockInfo;
  onClearChat?: () => void;
}

export function ChatHeader({ companyName, symbol, stockInfo, onClearChat }: ChatHeaderProps) {
  return (
    <div className="h-full px-4 flex items-center justify-between bg-[#0B0E14] border-b border-slate-800">
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-lg font-bold text-white">
          {companyName} ({symbol})
        </h2>
        
        <a
          href={`https://finance.yahoo.com/quote/${symbol}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-400 hover:underline ml-auto"
        >
          Yahoo Finance <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
