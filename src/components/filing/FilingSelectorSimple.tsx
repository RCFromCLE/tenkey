/**
 * FilingSelectorSimple Component
 * A simple modal for selecting additional filings to add to the chat
 */

import React from 'react';
import { X, FileText, Calendar, Plus } from 'lucide-react';
import { Filing } from '../../lib/types/filing';

interface FilingSelectorSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  availableFilings: Filing[];
  selectedFilings: Filing[];
  onFilingSelect: (filing: Filing) => void;
}

export function FilingSelectorSimple({
  isOpen,
  onClose,
  availableFilings,
  selectedFilings,
  onFilingSelect
}: FilingSelectorSimpleProps) {
  if (!isOpen) return null;

  const selectedAccessionNumbers = new Set(selectedFilings.map(f => f.accessionNumber));
  const unselectedFilings = availableFilings.filter(f => !selectedAccessionNumbers.has(f.accessionNumber));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Add Filing</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {unselectedFilings.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>All available filings are already loaded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unselectedFilings.map((filing) => (
                <div
                  key={filing.accessionNumber}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{filing.form}</div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{filing.filingDate}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onFilingSelect(filing);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
