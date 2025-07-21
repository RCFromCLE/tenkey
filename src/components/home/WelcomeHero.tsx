'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, TrendingUp, FileText, BarChart3, Sparkles, 
  ArrowRight, Building2, Globe, Zap, Shield, Brain,
  ChevronRight, Star, Users, Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Get instant insights from SEC filings with our friendly AI assistant Alex",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Zap,
    title: "Real-Time Data",
    description: "Access the latest filings and market data as soon as they're available",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Shield,
    title: "Trusted Sources",
    description: "All data comes directly from official SEC EDGAR database",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Globe,
    title: "Web-Enhanced",
    description: "Combine filing analysis with real-time web data for complete insights",
    color: "from-orange-500 to-red-500"
  }
];

const popularCompanies = [
  { symbol: 'AAPL', name: 'Apple', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer' },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Automotive' },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology' },
  { symbol: 'META', name: 'Meta', sector: 'Technology' },
  { symbol: 'BRK.B', name: 'Berkshire', sector: 'Finance' }
];

export function WelcomeHero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [animatedText, setAnimatedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  const words = ['Simple', 'Smart', 'Friendly', 'Powerful'];
  
  useEffect(() => {
    const word = words[currentWordIndex];
    let currentChar = 0;
    
    const typeInterval = setInterval(() => {
      if (currentChar <= word.length) {
        setAnimatedText(word.slice(0, currentChar));
        currentChar++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }, 2000);
      }
    }, 100);
    
    return () => clearInterval(typeInterval);
  }, [currentWordIndex]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // Navigate to company page
    router.push(`/company/${searchQuery.toUpperCase()}`);
  };

  const handleCompanyClick = (symbol: string) => {
    router.push(`/company/${symbol}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500 rounded-full filter blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Main Heading */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              SEC Filings Made{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 inline-block min-w-[140px]">
                {animatedText}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              Meet Alex, your AI financial analyst who turns complex SEC filings into 
              friendly conversations. No more boring reports! 🚀
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative flex items-center bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
                <Search className="w-6 h-6 text-slate-400 ml-6" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter a stock symbol (e.g., AAPL, MSFT, TSLA)"
                  className="flex-1 px-4 py-5 bg-transparent text-white placeholder-slate-400 focus:outline-none text-lg"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-8 py-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50"
                >
                  {isSearching ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
            <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-2xl p-6 text-center border border-slate-700/50 hover:border-blue-500/30 transition-all">
              <div className="text-3xl font-bold text-blue-400 font-mono">10K+</div>
              <div className="text-sm text-slate-400 mt-1">Companies Tracked</div>
            </div>
            <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-2xl p-6 text-center border border-slate-700/50 hover:border-purple-500/30 transition-all">
              <div className="text-3xl font-bold text-purple-400 font-mono">Real-time</div>
              <div className="text-sm text-slate-400 mt-1">Market Data</div>
            </div>
            <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-2xl p-6 text-center border border-slate-700/50 hover:border-cyan-500/30 transition-all">
              <div className="text-3xl font-bold text-cyan-400 font-mono">AI-Powered</div>
              <div className="text-sm text-slate-400 mt-1">Deep Analysis</div>
            </div>
            <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-2xl p-6 text-center border border-slate-700/50 hover:border-green-500/30 transition-all">
              <div className="text-3xl font-bold text-green-400 font-mono">100%</div>
              <div className="text-sm text-slate-400 mt-1">Transparent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Investors Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Tenkey</span>
          </h2>
          <p className="text-lg text-slate-400">
            Professional-grade financial intelligence powered by advanced AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all hover:transform hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Companies */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Popular Companies to Explore
          </h2>
          <p className="text-lg text-slate-400">
            Click any company to start chatting with Alex about their latest filings
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popularCompanies.map((company) => (
            <button
              key={company.symbol}
              onClick={() => handleCompanyClick(company.symbol)}
              className="group relative bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-all hover:transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  {company.symbol}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="text-left">
                <div className="text-sm text-slate-300">{company.name}</div>
                <div className="text-xs text-slate-500">{company.sector}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-30" />
          <div className="relative bg-slate-800/90 backdrop-blur-sm rounded-3xl p-12 text-center border border-slate-700">
            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Unlock Financial Intelligence?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of professional investors using Tenkey to gain deeper insights 
              from SEC filings with institutional-grade AI analysis.
            </p>
            <button
              onClick={() => setSearchQuery('AAPL')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105"
            >
              Try It Now - It's Free!
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-slate-400 text-sm mb-4 md:mb-0 font-mono">
              © 2025 Tenkey • Corratech LLC
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">About</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
