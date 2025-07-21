/**
 * ConversationSummaryModal Component - Optimized for Performance
 * Modal for displaying and managing conversation summaries
 */

import React, { useState, useMemo, useCallback } from 'react';
import { X, Download, Copy, FileText, Loader2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModelSelector } from '../ui/model-selector';
import { FilingReferenceFormatter } from '@/lib/services/filing-reference-formatter';
import { VirtualizedSummaryContent } from './VirtualizedSummaryContent';

interface ConversationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string | null;
  isGenerating: boolean;
  onGenerateSummary: (model: string) => void;
  models: any[];
  selectedModel: string;
  conversationData: {
    symbol: string;
    companyName?: string;
    topic: string;
    messages: any[];
  };
  filingContents?: string[];
}

// Memoized content formatter to prevent re-processing
const FormattedSummaryContent = React.memo(({ 
  summary, 
  filingContents 
}: { 
  summary: string; 
  filingContents: string[] 
}) => {
  const formattedContent = useMemo(() => {
    if (!summary) return '';
    
    // Use requestIdleCallback for non-blocking processing
    let formattedSummary = summary;
    
    // Only apply filing reference formatting if we have filing contents
    if (filingContents.length > 0) {
      formattedSummary = FilingReferenceFormatter.formatWithFilingReferences(
        summary, 
        filingContents
      );
    }
    
    // Apply lightweight markdown formatting
    return formattedSummary
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
      .replace(/\n\n/g, '</p><p class="mt-4">')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }, [summary, filingContents]);

  return (
    <div 
      className="text-slate-200 leading-relaxed whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
});

FormattedSummaryContent.displayName = 'FormattedSummaryContent';

export function ConversationSummaryModal({
  isOpen,
  onClose,
  summary,
  isGenerating,
  onGenerateSummary,
  models,
  selectedModel,
  conversationData,
  filingContents = []
}: ConversationSummaryModalProps) {
  const [summaryModel, setSummaryModel] = useState(selectedModel);
  const [showModelSelector, setShowModelSelector] = useState(false);

  // Memoize conversation stats to prevent recalculation
  const conversationStats = useMemo(() => {
    const totalMessages = conversationData.messages.length;
    const agentResponses = conversationData.messages.filter(m => m.agentId !== 'moderator').length;
    return { totalMessages, agentResponses };
  }, [conversationData.messages]);

  // Memoize model display name
  const modelDisplayName = useMemo(() => 
    summaryModel.split('/').pop(), 
    [summaryModel]
  );

  const handleGenerateSummary = useCallback(() => {
    onGenerateSummary(summaryModel);
  }, [onGenerateSummary, summaryModel]);

  const copyToClipboard = useCallback(async () => {
    if (!summary) return;
    
    try {
      await navigator.clipboard.writeText(summary);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [summary]);

  const downloadSummary = useCallback(() => {
    if (!summary) return;
    
    const content = `# Agent Conversation Summary\n\n**Symbol:** ${conversationData.symbol}\n**Company:** ${conversationData.companyName || 'N/A'}\n**Topic:** ${conversationData.topic}\n**Generated:** ${new Date().toLocaleString()}\n\n---\n\n${summary}`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversationData.symbol}-conversation-summary-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [summary, conversationData]);

  const handleModelSelectorToggle = useCallback(() => {
    setShowModelSelector(prev => !prev);
  }, []);

  const handleModelSelectorClose = useCallback(() => {
    setShowModelSelector(false);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-slate-200">Conversation Summary</h2>
              <p className="text-sm text-slate-400">
                {conversationData.symbol} - {conversationData.topic}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {summary && (
              <>
                <button
                  onClick={copyToClipboard}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300"
                  title="Copy Summary"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                <button
                  onClick={downloadSummary}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300"
                  title="Download Summary"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Model Selection */}
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Summary Model</span>
              {showModelSelector ? (
                <div className="flex items-center gap-2">
                  <ModelSelector
                    models={models}
                    selectedModel={summaryModel}
                    onModelSelect={setSummaryModel}
                    className="min-w-[200px]"
                  />
                  <button
                    onClick={handleModelSelectorClose}
                    className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded transition-colors text-slate-300"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleModelSelectorToggle}
                  className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors text-slate-300 flex items-center gap-1"
                >
                  {modelDisplayName}
                  <span className="text-slate-500">▼</span>
                </button>
              )}
            </div>
            
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg transition-colors text-sm font-medium disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  {summary ? 'Regenerate Summary' : 'Generate Summary'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                <p className="text-slate-300">Generating conversation summary...</p>
                <p className="text-sm text-slate-500 mt-2">This may take a few moments</p>
              </div>
            </div>
          ) : summary ? (
            <div className="h-full overflow-y-auto">
              <div className="p-6">
                <div className="prose prose-slate prose-invert max-w-none">
                  <FormattedSummaryContent 
                    summary={summary} 
                    filingContents={filingContents} 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No summary generated yet</p>
                <p className="text-sm text-slate-500">Click "Generate Summary" to create an AI-powered analysis of the conversation</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/30">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex flex-col gap-1">
              <span>
                {conversationStats.totalMessages} messages • {conversationStats.agentResponses} agent responses
              </span>
            </div>
            {summary && (
              <span>
                Summary generated with {modelDisplayName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
