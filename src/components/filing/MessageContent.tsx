import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { FilingReferenceFormatter } from '@/lib/services/filing-reference-formatter';
import { cleanHtml } from '@/lib/utils/filing-truncator';
import { formatAllTables } from '@/lib/utils/table-formatter';
import { AdvancedMessageFormatter } from '@/lib/services/advanced-message-formatter';

interface MessageContentProps {
  content: string;
  isUser?: boolean;
  isStreaming?: boolean;
  annotations?: Array<{
    text: string;
    source: string;
    page?: number;
  }>;
  filingContents?: string[];
}

/**
 * MessageContent component that renders markdown content with syntax highlighting
 * and proper formatting for financial data
 */
export const MessageContent = memo(({ content, isUser = false, isStreaming = false, annotations = [], filingContents = [] }: MessageContentProps) => {
  // Ensure we have content to display and clean any HTML
  let displayContent = cleanHtml(content || '');
  
  // For assistant messages, apply advanced formatting
  if (!isUser) {
    // Apply advanced message formatting which includes table formatting
    displayContent = AdvancedMessageFormatter.format(displayContent, {
      enhanceStructure: true,
      improveReadability: true,
      formatFinancialData: true,
      addVisualHierarchy: true,
      optimizeForScanning: true,
      cleanupResponse: false, // Already cleaned HTML above
      formatTables: true,
      highlightKeyMetrics: true
    });
  }
  
  // For assistant messages, apply filing reference formatting
  if (!isUser && filingContents.length > 0) {
    displayContent = FilingReferenceFormatter.formatWithFilingReferences(displayContent, filingContents);
  }
  
  // For user messages, render as plain text
  if (isUser) {
    return (
      <div className="whitespace-pre-wrap break-words text-white">
        {displayContent}
      </div>
    );
  }
  
  // For assistant messages, render as markdown with enhanced formatting
  return (
    <div className={cn(
      "prose prose-invert max-w-none",
      "prose-headings:text-slate-200 prose-headings:font-semibold",
      "prose-p:text-slate-200 prose-p:leading-relaxed",
      "prose-strong:text-white prose-strong:font-semibold",
      "prose-em:text-slate-300",
      "prose-code:text-blue-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
      "prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700",
      "prose-blockquote:border-l-blue-500 prose-blockquote:bg-slate-900/50 prose-blockquote:text-slate-300",
      "prose-ul:text-slate-200 prose-ol:text-slate-200",
      "prose-li:text-slate-200 prose-li:marker:text-slate-400",
      "prose-table:text-slate-200",
      "prose-th:text-slate-100 prose-th:bg-slate-800 prose-th:border-slate-600",
      "prose-td:border-slate-600",
      "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
    )}>
      <ReactMarkdown
        rehypePlugins={[]}
        remarkPlugins={[]}
        skipHtml={true}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={language}
                  PreTag="div"
                  className="rounded-md"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-slate-600 bg-slate-900/50">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-slate-600 bg-slate-800 px-3 py-2 text-left font-semibold text-slate-100">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-slate-600 px-3 py-2 text-slate-200">
                {children}
              </td>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 bg-slate-900/50 pl-4 py-2 my-4 italic text-slate-300">
                {children}
              </blockquote>
            );
          },
          h1({ children }) {
            return <h1 className="text-2xl font-bold text-slate-100 mb-4 mt-6">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-semibold text-slate-100 mb-3 mt-5">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-4">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="text-base font-semibold text-slate-200 mb-2 mt-3">{children}</h4>;
          },
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 my-3 text-slate-200">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 my-3 text-slate-200">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-slate-200 leading-relaxed">{children}</li>;
          },
          p({ children }) {
            return <p className="text-slate-200 leading-relaxed mb-3">{children}</p>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-white">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-slate-300">{children}</em>;
          }
        }}
      >
        {displayContent}
      </ReactMarkdown>
      
      {/* Streaming cursor */}
      {isStreaming && displayContent && (
        <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse ml-1 align-text-bottom" />
      )}
      
      {/* Render annotations if present */}
      {annotations && annotations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Sources:</h4>
          <div className="space-y-1">
            {annotations.map((annotation, index) => (
              <div key={index} className="text-xs text-blue-400 bg-slate-900/50 px-2 py-1 rounded">
                <span className="text-slate-400">"{annotation.text}"</span>
                <span className="ml-2">- {annotation.source}</span>
                {annotation.page && <span className="ml-1">(Page {annotation.page})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

MessageContent.displayName = 'MessageContent';
