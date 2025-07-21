import React, { useMemo, useCallback, useState } from 'react';
import { X, Plus, Check, Minus, Loader2 } from 'lucide-react';
import type { Filing, SECFiling } from '@/lib/types/filing';

interface FilingSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  filings: Filing[];
  selectedFilings: Filing[];
  loading?: boolean;
  onFilingSelect: (filing: SECFiling) => void;
  onBulkAdd?: (filings: SECFiling[]) => void;
  onBulkRemove?: (accessionNumbers: string[]) => void;
}

// Memoized filing item component for better performance
const FilingSelectItem = React.memo(({ 
  filing, 
  isSelected,
  isChecked,
  onToggleCheck,
  onSelect 
}: { 
  filing: Filing;
  isSelected: boolean;
  isChecked: boolean;
  onToggleCheck: (filing: Filing, checked: boolean) => void;
  onSelect: (filing: SECFiling) => void; 
}) => (
  <div className={`p-4 border rounded-lg transition-all ${
    isSelected 
      ? 'bg-green-900/20 border-green-700' 
      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700'
  }`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onToggleCheck(filing, e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
        />
        <div>
          <div className="font-medium text-white">{filing.form}</div>
          <div className="text-sm text-slate-400">{filing.filingDate}</div>
          {(filing as any).description && (
            <div className="text-xs text-slate-500 mt-1">
              {(filing as any).description}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isSelected && (
          <span className="text-xs text-green-400 font-medium">Added</span>
        )}
        <button
          onClick={() => onSelect(filing as SECFiling)}
          className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
          title={isSelected ? "Remove filing" : "Add filing"}
        >
          {isSelected ? (
            <Minus className="w-4 h-4 text-red-400" />
          ) : (
            <Plus className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>
    </div>
  </div>
));

FilingSelectItem.displayName = 'FilingSelectItem';

/**
 * FilingSelectorModal component for selecting additional filings
 * to add to the chat context with bulk operations support.
 */
export const FilingSelectorModal = React.memo(({
  isOpen,
  onClose,
  filings,
  selectedFilings,
  loading = false,
  onFilingSelect,
  onBulkAdd,
  onBulkRemove
}: FilingSelectorModalProps) => {
  const [checkedFilings, setCheckedFilings] = useState<Set<string>>(new Set());

  // Memoize the filtering and categorization
  const { availableFilings, selectedFilingsSet } = useMemo(() => {
    const selectedAccessionNumbers = new Set(selectedFilings.map(sf => sf.accessionNumber));
    return {
      availableFilings: filings.filter(f => !selectedAccessionNumbers.has(f.accessionNumber)),
      selectedFilingsSet: selectedAccessionNumbers
    };
  }, [filings, selectedFilings]);

  const handleFilingSelect = useCallback((filing: SECFiling) => {
    onFilingSelect(filing);
  }, [onFilingSelect]);

  const handleToggleCheck = useCallback((filing: Filing, checked: boolean) => {
    setCheckedFilings(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(filing.accessionNumber);
      } else {
        newSet.delete(filing.accessionNumber);
      }
      return newSet;
    });
  }, []);

  const handleBulkAdd = useCallback(() => {
    if (onBulkAdd && checkedFilings.size > 0) {
      const filingsToAdd = filings.filter(f => 
        checkedFilings.has(f.accessionNumber) && 
        !selectedFilingsSet.has(f.accessionNumber)
      );
      onBulkAdd(filingsToAdd as SECFiling[]);
      setCheckedFilings(new Set());
    }
  }, [checkedFilings, filings, selectedFilingsSet, onBulkAdd]);

  const handleBulkRemove = useCallback(() => {
    if (onBulkRemove && checkedFilings.size > 0) {
      const accessionNumbersToRemove = Array.from(checkedFilings).filter(accessionNumber =>
        selectedFilingsSet.has(accessionNumber)
      );
      onBulkRemove(accessionNumbersToRemove);
      setCheckedFilings(new Set());
    }
  }, [checkedFilings, selectedFilingsSet, onBulkRemove]);

  const handleSelectAll = useCallback(() => {
    const allAccessionNumbers = new Set(filings.map(f => f.accessionNumber));
    setCheckedFilings(allAccessionNumbers);
  }, [filings]);

  const handleDeselectAll = useCallback(() => {
    setCheckedFilings(new Set());
  }, []);

  const checkedCount = checkedFilings.size;
  const checkedAvailableCount = Array.from(checkedFilings).filter(accessionNumber => 
    !selectedFilingsSet.has(accessionNumber)
  ).length;
  const checkedSelectedCount = Array.from(checkedFilings).filter(accessionNumber => 
    selectedFilingsSet.has(accessionNumber)
  ).length;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Add Filing</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto">
          {loading ? (
            /* Loading Screen */
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
              <p className="text-slate-400 text-center">Loading available filings...</p>
              <p className="text-slate-500 text-sm text-center mt-2">
                This may take a moment while we fetch the latest SEC filings.
              </p>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              {filings.length > 0 && (
                <div className="mb-4 p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSelectAll}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Select All
                      </button>
                      <button
                        onClick={handleDeselectAll}
                        className="text-sm text-slate-400 hover:text-slate-300"
                      >
                        Deselect All
                      </button>
                    </div>
                    <span className="text-sm text-slate-400">
                      {checkedCount} selected
                    </span>
                  </div>
                  
                  {checkedCount > 0 && (
                    <div className="flex gap-2">
                      {checkedAvailableCount > 0 && (
                        <button
                          onClick={handleBulkAdd}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                        >
                          Add {checkedAvailableCount} Filing{checkedAvailableCount !== 1 ? 's' : ''}
                        </button>
                      )}
                      {checkedSelectedCount > 0 && (
                        <button
                          onClick={handleBulkRemove}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                        >
                          Remove {checkedSelectedCount} Filing{checkedSelectedCount !== 1 ? 's' : ''}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {filings.length === 0 ? (
                <p className="text-center text-slate-400 py-8">
                  No filings available.
                </p>
              ) : (
                <div className="space-y-3">
                  {filings.map((filing) => (
                    <FilingSelectItem
                      key={filing.accessionNumber}
                      filing={filing}
                      isSelected={selectedFilingsSet.has(filing.accessionNumber)}
                      isChecked={checkedFilings.has(filing.accessionNumber)}
                      onToggleCheck={handleToggleCheck}
                      onSelect={handleFilingSelect}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

FilingSelectorModal.displayName = 'FilingSelectorModal';
