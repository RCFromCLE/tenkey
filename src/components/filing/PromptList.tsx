/**
 * PromptList Component
 * Renders grouped prompts with edit/delete functionality
 */

import React, { useState } from 'react';
import { Lightbulb, Edit2, Trash2, Star } from 'lucide-react';
import { Prompt } from '../../lib/types/filing-chat';

interface PromptListProps {
  groupedPrompts: Record<string, Prompt[]>;
  onPromptSelect: (prompt: Prompt) => void;
  onUpdatePrompt: (promptId: string, newText: string) => void;
  onDeletePrompt: (promptId: string) => void;
  onToggleFavorite: (promptId: string) => void;
}

export function PromptList({
  groupedPrompts,
  onPromptSelect,
  onUpdatePrompt,
  onDeletePrompt,
  onToggleFavorite
}: PromptListProps) {
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const handleUpdatePrompt = (promptId: string, newText: string) => {
    onUpdatePrompt(promptId, newText);
    setEditingPrompt(null);
  };

  return (
    <div className="overflow-y-auto flex-1">
      {Object.entries(groupedPrompts).length > 0 ? (
        Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
          <div key={category} className="border-b border-slate-700/50 last:border-0">
            <div className="px-4 py-2 bg-slate-900/30 sticky top-0">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {category}
              </h4>
            </div>
            <div className="p-2">
              {categoryPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className="group flex items-center gap-2 px-3 py-2.5 hover:bg-slate-700/50 rounded-md transition-colors cursor-pointer"
                  onClick={() => onPromptSelect(prompt)}
                >
                  {editingPrompt?.id === prompt.id ? (
                    <input
                      type="text"
                      defaultValue={prompt.text}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdatePrompt(prompt.id, e.currentTarget.value);
                        } else if (e.key === 'Escape') {
                          setEditingPrompt(null);
                        }
                      }}
                      onBlur={(e) => handleUpdatePrompt(prompt.id, e.currentTarget.value)}
                      className="flex-1 px-2 py-1 text-sm bg-slate-900/50 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4 text-yellow-400/80 flex-shrink-0" />
                      <span className="flex-1 text-sm text-slate-200">{prompt.text}</span>
                      {prompt.isFavorite && (
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      )}
                      {prompt.isCustom && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPrompt(prompt);
                            }}
                            className="p-1.5 hover:bg-slate-600 rounded-md"
                            title="Edit prompt"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(prompt.id);
                            }}
                            className="p-1.5 hover:bg-slate-600 rounded-md"
                            title={prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star className={`w-3.5 h-3.5 ${prompt.isFavorite ? 'fill-yellow-400' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePrompt(prompt.id);
                            }}
                            className="p-1.5 hover:bg-red-500/20 rounded-md"
                            title="Delete prompt"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="p-6 text-center text-slate-400">
          <p>No prompts found.</p>
          <p className="text-xs mt-2">Try adjusting your search or add custom prompts.</p>
        </div>
      )}
    </div>
  );
}
