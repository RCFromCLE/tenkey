import React, { useState } from 'react';
import { FileText, ExternalLink, X, Plus, Loader2 } from 'lucide-react';
import type { Filing } from '@/lib/types/filing';

interface FilingsListProps {
  selectedFilings: Filing[];
  onRemoveFiling: (accessionNumber: string) => void;
  onAddFilingClick: () => void;
}

// Memoized filing item component to prevent unnecessary re-renders
const FilingItem = React.memo(({ 
  filing, 
  onRemove 
}: { 
  filing: Filing; 
  onRemove: (accessionNumber: string) => void; 
}) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(filing.accessionNumber);
    } catch (error) {
      console.error('Error removing filing:', error);
      setIsRemoving(false); // Reset on error
    }
    // Don't reset isRemoving on success - component will unmount
  };

  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
        isRemoving 
          ? 'bg-red-900/20 border-red-700/50 opacity-50' 
          : 'bg-slate-800/60 border-slate-700/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-blue-400" />
        <div>
          <div className="text-sm font-medium text-slate-200">{filing.form}</div>
          <div className="text-xs text-slate-400">{filing.filingDate}</div>
          {isRemoving && (
            <div className="text-xs text-red-400 mt-1">Removing...</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={filing.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
          title="View on SEC.gov"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="p-1.5 hover:bg-red-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Remove filing"
        >
          {isRemoving ? (
            <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
          ) : (
            <X className="w-3.5 h-3.5 text-red-400" />
          )}
        </button>
      </div>
    </div>
  );
});

FilingItem.displayName = 'FilingItem';

/**
 * FilingsList component for displaying selected filings
 * in the control panel with options to view or remove them.
 */
export const FilingsList = React.memo(({ 
  selectedFilings, 
  onRemoveFiling, 
  onAddFilingClick 
}: FilingsListProps) => {
  return (
    <div className="space-y-2">
      {selectedFilings.map((filing) => (
        <FilingItem
          key={filing.accessionNumber}
          filing={filing}
          onRemove={onRemoveFiling}
        />
      ))}
        
      {/* Add Filing Button */}
      <button
        onClick={onAddFilingClick}
        className="w-full p-3 bg-slate-800/40 hover:bg-slate-800/60 border border-dashed border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-300"
      >
        <Plus className="w-4 h-4" />
        Add Filing
      </button>
    </div>
  );
});

FilingsList.displayName = 'FilingsList';
