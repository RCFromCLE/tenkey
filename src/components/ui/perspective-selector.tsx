'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, BarChart3, X, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ANALYSIS_PERSPECTIVES, type AnalysisPerspective } from '@/lib/services/analysis-perspectives';

interface PerspectiveSelectorProps {
  selectedPerspectives: string[];
  onPerspectivesChange: (perspectives: string[]) => void;
  className?: string;
}

export function PerspectiveSelector({ selectedPerspectives, onPerspectivesChange, className }: PerspectiveSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredPerspective, setHoveredPerspective] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePerspective = (perspectiveId: string) => {
    if (selectedPerspectives.includes(perspectiveId)) {
      onPerspectivesChange(selectedPerspectives.filter(id => id !== perspectiveId));
    } else {
      onPerspectivesChange([...selectedPerspectives, perspectiveId]);
    }
  };

  const clearAll = () => {
    onPerspectivesChange([]);
  };

  const selectPreset = (preset: string[]) => {
    onPerspectivesChange(preset);
  };

  const perspectives = Object.values(ANALYSIS_PERSPECTIVES);
  const selectedCount = selectedPerspectives.length;

  // Preset combinations
  const presets = [
    { name: 'Balanced View', perspectives: ['balanced'], description: 'Single objective analysis' },
    { name: 'Bull vs Bear', perspectives: ['optimistic', 'cautious'], description: 'Optimistic vs risk-focused views' },
    { name: 'Full Spectrum', perspectives: ['optimistic', 'cautious', 'balanced', 'critical'], description: 'Complete range of viewpoints' },
    { name: 'Technical Deep Dive', perspectives: ['quantitative', 'value_oriented', 'growth_focused'], description: 'Data-driven analysis focus' },
    { name: 'Risk Assessment', perspectives: ['risk_assessment', 'cautious', 'critical'], description: 'Conservative risk analysis' },
    { name: 'Growth Focus', perspectives: ['growth_focused', 'optimistic', 'strategic'], description: 'Growth and opportunity analysis' },
  ];

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm",
          "bg-slate-800/60 hover:bg-slate-800 rounded-lg border transition-all",
          selectedCount > 0 
            ? "border-blue-500/50 text-blue-400" 
            : "border-slate-700/50 text-slate-300"
        )}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          <span>
            {selectedCount === 0 
              ? "Select Analysis Perspectives" 
              : `${selectedCount} Perspective${selectedCount > 1 ? 's' : ''} Selected`}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {/* Header with presets */}
          <div className="p-3 border-b border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Quick Presets
              </h3>
              {selectedCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => selectPreset(preset.perspectives)}
                  className={cn(
                    "p-2 text-xs rounded-md border transition-all text-left",
                    JSON.stringify(selectedPerspectives.sort()) === JSON.stringify(preset.perspectives.sort())
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                      : "bg-slate-900/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                  )}
                >
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Individual perspective selection */}
          <div className="max-h-[400px] overflow-y-auto">
            <div className="p-3">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Analysis Perspectives
              </h3>
              <div className="space-y-1">
                {perspectives.map((perspective) => (
                  <div
                    key={perspective.id}
                    className={cn(
                      "relative rounded-lg transition-all",
                      selectedPerspectives.includes(perspective.id) 
                        ? perspective.bgColor 
                        : "hover:bg-slate-700/30"
                    )}
                    onMouseEnter={() => setHoveredPerspective(perspective.id)}
                    onMouseLeave={() => setHoveredPerspective(null)}
                  >
                    <button
                      onClick={() => togglePerspective(perspective.id)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 text-left transition-all rounded-lg",
                        selectedPerspectives.includes(perspective.id) && perspective.borderColor,
                        selectedPerspectives.includes(perspective.id) && "border"
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                          selectedPerspectives.includes(perspective.id)
                            ? `${perspective.color} border-current`
                            : "border-slate-600"
                        )}>
                          {selectedPerspectives.includes(perspective.id) && (
                            <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            "font-medium",
                            selectedPerspectives.includes(perspective.id) ? perspective.color : "text-slate-200"
                          )}>
                            {perspective.label}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{perspective.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-slate-500">Approach:</span>
                          <span className="text-[10px] text-slate-400">{perspective.approach}</span>
                        </div>
                      </div>
                      {hoveredPerspective === perspective.id && (
                        <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                      )}
                    </button>

                    {/* Hover tooltip with more details */}
                    {hoveredPerspective === perspective.id && (
                      <div className="absolute left-full ml-2 top-0 z-10 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
                        <h5 className={cn("font-medium mb-2", perspective.color)}>
                          {perspective.label}
                        </h5>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-400">Focus Areas:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {perspective.analysisStyle.focus.map((focus) => (
                                <span key={focus} className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                                  {focus}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Analysis Style:</span>
                            <p className="text-slate-300 mt-0.5">{perspective.analysisStyle.tone}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Key Terms:</span>
                            <p className="text-slate-300 mt-0.5 italic">
                              "{perspective.analysisStyle.keywords.slice(0, 3).join('", "')}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer with summary */}
          {selectedCount > 0 && (
            <div className="p-3 border-t border-slate-700 bg-slate-900/50">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <BarChart3 className="w-3 h-3" />
                <span>Selected perspectives will provide unique viewpoints on the financial data</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
