/**
 * Type definitions for the FilingChat component
 */

import type { Filing, SECFiling } from './filing';

/**
 * Represents a chat message between user and assistant
 */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  annotations?: any[];
  analysis?: string;
  isStreaming?: boolean;
  error?: boolean;
  isAgentAnalysis?: boolean;
  isConfirmation?: boolean;
  agentAnalysisBuffer?: string;
}

/**
 * Represents an AI model configuration
 */
export interface Model {
  id: string;
  name: string;
  provider?: string;
  contextLength?: number;
  description?: string;
  capabilities?: string[];
  costTier?: 'free' | 'low' | 'medium' | 'high';
  pricing?: {
    prompt: string;
    completion: string;
  };
}

/**
 * Represents a chat prompt suggestion
 */
export interface Prompt {
  id: string;
  text: string;
  category: string;
  filingType?: 'common' | '10-K' | '10-Q';
  isCustom?: boolean;
  isFavorite?: boolean;
  agentId?: string;
}

/**
 * Props for the FilingChat component
 */
export interface FilingChatProps {
  filing: Filing;
  companyName?: string;
  userId: string;
  onFilingChange: (filing: Filing) => void;
  filings: Filing[];
  onFilingSelect: (filing: SECFiling) => void;
  isLoadingFiling: boolean;
  initialChatId?: string;
  stockInfo?: StockInfo;
}

/**
 * Stock information display data
 */
export interface StockInfo {
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

/**
 * Toggle switch component props
 */
export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  Icon: React.ElementType;
  label: string;
  description: string;
}

/**
 * Code block component props
 */
export interface CodeBlockProps {
  children?: React.ReactNode;
}
