import React, { useState, useCallback, memo } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  children?: React.ReactNode;
}

/**
 * CodeBlock component for displaying code snippets with syntax highlighting
 * and copy-to-clipboard functionality.
 */
export const CodeBlock = memo(({ children }: CodeBlockProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (typeof children === 'string') {
      navigator.clipboard.writeText(children);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [children]);

  return (
    <div className="relative my-4 group">
      <pre className="p-4 text-sm rounded-lg bg-slate-900/70 border border-slate-700 overflow-x-auto">
        <code>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute p-1.5 transition-all duration-200 bg-slate-700/50 rounded-md top-2 right-2 text-slate-400 hover:bg-slate-600/50 hover:text-white opacity-0 group-hover:opacity-100"
        title="Copy to clipboard"
      >
        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';
