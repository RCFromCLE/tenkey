// src/components/company-search/CompanySearch.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';

interface Company {
  symbol: string;
  name: string;
  exchange: string;
}

export function CompanySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setFocused(false);
        setResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCompanies = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/yahoo?symbol=${encodeURIComponent(searchQuery)}&mode=search`);
      if (!response.ok) {
        console.error('Search API error:', response.status);
        setResults([]);
        return;
      }
      const data = await response.json();
      console.log('Search results:', data); // Debug log
      setResults(data.quotes || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        searchCompanies(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleCompanySelect = (symbol: string) => {
    router.push(`/company/${symbol}`);
    setResults([]);
    setQuery('');
    setFocused(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl mx-auto z-50">
      <div className={`relative transition-all duration-300 ${focused ? 'scale-[1.02]' : 'scale-100'}`}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search by company name or ticker symbol..."
            className="w-full h-14 bg-slate-900 text-slate-100 placeholder-slate-500 
                     px-12 rounded-lg border border-slate-700 
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                     transition-all duration-200 outline-none text-base
                     hover:bg-slate-800 hover:border-slate-600"
          />
          
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className={`w-5 h-5 transition-colors duration-200 
              ${focused ? 'text-blue-400' : 'text-slate-500'}`}
            />
          </div>

          {/* Clear Button */}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400/80 
                       hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <Loader2 className="w-5 h-5 text-emerald-400/90 animate-spin" />
            </div>
          )}
        </div>

        {/* Enhanced Search Results */}
        {focused && (results.length > 0 || loading || query) && (
          <div className="absolute w-full mt-2 bg-slate-900 border border-slate-700 
                        rounded-lg shadow-xl overflow-hidden
                        transform transition-all duration-200 z-[100] max-h-[400px] overflow-y-auto">
            
            {/* Results Header */}
            {results.length > 0 && (
              <div className="px-4 py-2 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-300">
                    Search Results
                  </h3>
                  <span className="text-xs text-slate-400">
                    {results.length} found
                  </span>
                </div>
              </div>
            )}

            {/* Company Results */}
            <div className="py-2">
              {results.map((company, index) => (
                <button
                  key={company.symbol}
                  onClick={() => handleCompanySelect(company.symbol)}
                  className="w-full px-4 py-3 flex items-center justify-between 
                           hover:bg-slate-800 active:bg-slate-700
                           transition-colors group text-left
                           border-b border-slate-800 last:border-b-0"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Company Icon/Avatar */}
                    <div className="w-10 h-10 rounded-lg bg-slate-800 
                                  border border-slate-700 flex items-center justify-center flex-shrink-0
                                  group-hover:bg-slate-700 transition-colors">
                      <span className="text-sm font-bold text-blue-400">
                        {company.symbol.charAt(0)}
                      </span>
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {company.symbol}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                          {company.exchange}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 truncate">
                        {company.name}
                      </p>
                    </div>
                  </div>
                  
                  {/* Arrow Icon */}
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 
                                       transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Loading State */}
            {loading && results.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 
                              border border-emerald-500/30 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Searching Companies</h3>
                <p className="text-sm text-slate-400">Finding the best matches for "{query}"...</p>
              </div>
            )}

            {/* No Results State */}
            {!loading && results.length === 0 && query && (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 
                              border border-slate-700/50 flex items-center justify-center">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">No Results Found</h3>
                <p className="text-sm text-slate-400">
                  Try searching with a different company name or ticker symbol
                </p>
              </div>
            )}

            {/* Quick Tips Footer */}
            {results.length > 0 && (
              <div className="px-6 py-3 bg-slate-900/30 border-t border-slate-700/40">
                <p className="text-xs text-slate-400 text-center">
                  💡 <span className="font-medium">Tip:</span> Click any company to analyze their SEC filings
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
