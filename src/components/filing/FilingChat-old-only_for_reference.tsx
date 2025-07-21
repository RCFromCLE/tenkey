'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, Bot, User, Loader2, X, Plus, Download, Copy, Check, ChevronDown, FileText, ExternalLink, Lightbulb, Search, Star, Edit2, Trash2, BrainCircuit, Calendar, Globe, Mic, MicOff, Volume2, VolumeX, ArrowDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Filing, SECFiling } from '../../lib/types/filing';
import { messageFormatter } from '../../lib/services/message-formatter';
import { EnhancedMessageFormatter } from '../../lib/services/message-formatter-enhanced';
import { PDFExporter } from '../../lib/utils/pdf-export';
import { analysisAgent } from '../../lib/services/analysis-agent';
import { OpenRouterService } from '../../lib/services/openrouter';
import { cn } from '../../lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { ModelSelector } from '../ui/model-selector';
import { AgentDropdown } from '../ui/agent-dropdown';
import { extractPageReference } from '../../lib/utils/filing-truncator';
import { AgentSelectionDialog } from '../ui/agent-selection-dialog';
import { AGENT_PERSONAS } from '../../lib/services/agent-personas-improved';
import { useSpeechRecognition } from '../../lib/hooks/use-speech-recognition';
import { useTextToSpeech } from '../../lib/hooks/use-text-to-speech';
import { VoiceSelector } from '../ui/voice-selector';
import { DEFAULT_VOICE } from '../../lib/services/google-voices';

// --- TYPE DEFINITIONS ---

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  annotations?: any[];
  analysis?: string;
  isStreaming?: boolean;
  error?: boolean;
}

interface Model {
  id: string;
  name: string;
}

interface Prompt {
  id: string;
  text: string;
  category: string;
  filingType?: 'common' | '10-K' | '10-Q';
  isCustom?: boolean;
  isFavorite?: boolean;
}

interface FilingChatProps {
  filing: Filing;
  companyName?: string;
  userId: string;
  onFilingChange: (filing: Filing) => void;
  filings: Filing[];
  onFilingSelect: (filing: SECFiling) => void;
  isLoadingFiling: boolean;
  initialChatId?: string;
  stockInfo?: {
    price: string;
    change: string;
    changePercent: string;
    dayRange?: string;
    volume?: string;
    marketCap?: string;
    previousClose?: string;
    open?: string;
    bid?: string;
    ask?: string;
    yearRange?: string;
    eps?: string;
    pe?: string;
    dividend?: string;
    beta?: string;
  };
}

// --- CONSTANTS & CONFIGURATION ---

const SUGGESTED_PROMPTS = {
  'common': {
    'Quick Analysis': [
      'What are the key takeaways?',
      'How did revenue and profits change?',
      'What\'s the cash position?',
      'Main risks to watch?',
      'Any red flags?',
      'Investment thesis summary?',
    ],
    'Financial Metrics': [
      'Revenue growth rate?',
      'Profit margins trend?',
      'Debt levels and ratios?',
      'Free cash flow?',
      'Working capital changes?',
      'Return on equity?',
      'EBITDA margins?',
      'Interest coverage ratio?',
    ],
    'Business Performance': [
      'Top performing segments?',
      'Geographic revenue breakdown?',
      'Customer concentration?',
      'Market share changes?',
      'Product mix shifts?',
      'Pricing power indicators?',
      'Volume vs price growth?',
    ],
    'Strategic Insights': [
      'Management\'s outlook?',
      'Key growth initiatives?',
      'Capital allocation plans?',
      'Competitive positioning?',
      'M&A activity or plans?',
      'R&D investments?',
      'Digital transformation efforts?',
    ],
    'Risk Assessment': [
      'Regulatory risks?',
      'Supply chain vulnerabilities?',
      'Currency exposure?',
      'Cybersecurity mentions?',
      'Climate-related risks?',
      'Litigation exposure?',
      'Key person dependencies?',
    ],
    'Operational Metrics': [
      'Headcount changes?',
      'Capacity utilization?',
      'Inventory turnover?',
      'Days sales outstanding?',
      'Same-store sales growth?',
      'Customer acquisition cost?',
      'Churn or retention rates?',
    ],
  },
  '10-K': {
    'Annual Overview': [
      'Business model summary?',
      'Full year financial performance?',
      'Major strategic changes?',
      'Executive compensation details?',
      'Board composition changes?',
      'Auditor opinions or changes?',
    ],
    'Deep Dive': [
      'Industry and competition analysis?',
      'Long-term debt schedule?',
      'Legal proceedings update?',
      'Critical accounting policies?',
      'Tax rate changes?',
      'Pension obligations?',
      'Off-balance sheet items?',
      'Related party transactions?',
    ],
    'Forward Looking': [
      'Multi-year growth targets?',
      'Long-term margin goals?',
      'Capital expenditure plans?',
      'Market expansion strategy?',
      'Technology roadmap?',
      'Sustainability commitments?',
    ],
  },
  '10-Q': {
    'Quarterly Focus': [
      'Quarter vs same quarter last year?',
      'Sequential quarter changes?',
      'Updated guidance?',
      'New developments this quarter?',
      'Earnings quality assessment?',
      'One-time items impact?',
    ],
    'Trend Analysis': [
      'YTD performance vs prior year?',
      'Seasonal factors impact?',
      'Balance sheet changes?',
      'Any accounting changes?',
      'Backlog or pipeline trends?',
      'Monthly revenue patterns?',
      'Cost inflation impacts?',
    ],
    'Recent Events': [
      'Management changes?',
      'New product launches?',
      'Partnership announcements?',
      'Restructuring updates?',
      'Share buyback activity?',
      'Dividend policy changes?',
      'Credit facility updates?',
    ],
  },
};

// Function to flatten the new prompt structure into the old Prompt[] format
const flattenPrompts = (): Prompt[] => {
  const allPrompts: Prompt[] = [];
  let idCounter = 0;

  for (const type of Object.keys(SUGGESTED_PROMPTS)) {
    const categories = SUGGESTED_PROMPTS[type as keyof typeof SUGGESTED_PROMPTS];
    for (const category in categories) {
      const prompts = (categories as any)[category];
      for (const text of prompts) {
        allPrompts.push({
          id: `${type}-${idCounter++}`,
          text,
          category: category,
          filingType: type as 'common' | '10-K' | '10-Q',
        });
      }
    }
  }
  return allPrompts;
};

const DEFAULT_PROMPTS = flattenPrompts();

// --- HELPER COMPONENTS ---

const CodeBlock = memo(({ children }: { children?: React.ReactNode }) => {
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
      <button onClick={handleCopy} className="absolute p-1.5 transition-all duration-200 bg-slate-700/50 rounded-md top-2 right-2 text-slate-400 hover:bg-slate-600/50 hover:text-white opacity-0 group-hover:opacity-100" title="Copy to clipboard">
        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
});
CodeBlock.displayName = 'CodeBlock';

const ToggleSwitch = ({ checked, onChange, title, Icon, label, description }: { checked: boolean; onChange: (checked: boolean) => void; title: string; Icon: React.ElementType; label: string; description: string; }) => (
    <div className="flex items-start justify-between p-3 rounded-lg transition-colors hover:bg-slate-800/60">
        <div className="flex items-start gap-3">
            <Icon className={cn("w-5 h-5 mt-1", checked ? "text-blue-400" : "text-slate-500")} />
            <div>
                <h4 className="text-sm font-medium text-slate-200">{label}</h4>
                <p className="text-xs text-slate-400">{description}</p>
            </div>
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out flex-shrink-0",
                checked ? 'bg-blue-600' : 'bg-slate-600'
            )}
            title={title}
        >
            <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out",
                checked ? 'translate-x-6' : 'translate-x-1'
            )} />
        </button>
    </div>
);

// --- MAIN COMPONENT ---

export function FilingChat({
  filing,
  companyName,
  userId,
  filings,
  onFilingSelect,
  initialChatId,
  stockInfo
}: FilingChatProps) {
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(initialChatId);
  const [selectedFilings, setSelectedFilings] = useState<Filing[]>([filing]);
  const [showFilingSelector, setShowFilingSelector] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedAnalysisModel, setSelectedAnalysisModel] = useState<string>('');
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false); // Default to false
  const [apiKey, setApiKey] = useState<string>('');
  const [currentAnalysis, setCurrentAnalysis] = useState<string>('');
  const [selectedAgentPersonas, setSelectedAgentPersonas] = useState<string[]>([]); // Selected agent personas
  const [agentModels, setAgentModels] = useState<Record<string, string>>({}); // Model configuration for each agent
  const [showAgentSelectionDialog, setShowAgentSelectionDialog] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string>('');
  const [showAnalysis, setShowAnalysis] = useState(false); // Collapsed by default
  const [enableTTS, setEnableTTS] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE);
  const [speakingRate, setSpeakingRate] = useState(1);
  
  // Prompt management state
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    const savedPrompts = localStorage.getItem(`prompts_${userId}`);
    return savedPrompts ? [...DEFAULT_PROMPTS, ...JSON.parse(savedPrompts)] : DEFAULT_PROMPTS;
  });
  const [showPromptDropdown, setShowPromptDropdown] = useState(false);
  const [promptSearch, setPromptSearch] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('Custom');
  const [activeTab, setActiveTab] = useState<'All' | '10-K' | '10-Q' | 'Custom'>('All');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const promptDropdownRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const {
    isListening,
    isAvailable: isSpeechRecognitionAvailable,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setInput(transcript);
    },
    onEnd: () => {
      if (input) {
        handleSubmit(input);
      }
    }
  });

  const { isSpeaking, isAvailable: isTTSAvailable, speak, cancel } = useTextToSpeech();

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSpeakerClick = (text: string, messageId: string) => {
    if (isSpeaking && currentlyPlaying === messageId) {
      cancel();
      setCurrentlyPlaying(null);
    } else {
      speak(EnhancedMessageFormatter.formatForSpeech(text), selectedVoice, speakingRate);
      setCurrentlyPlaying(messageId);
    }
  };

  // Prompt management functions
  const saveCustomPrompts = (customPrompts: Prompt[]) => {
    localStorage.setItem(`prompts_${userId}`, JSON.stringify(customPrompts));
  };

  const addCustomPrompt = () => {
    if (!newPromptText.trim()) return;
    
    const newPrompt: Prompt = {
      id: `custom_${Date.now()}`,
      text: newPromptText.trim(),
      category: 'Custom',
      isCustom: true
    };
    
    const updatedPrompts = [...prompts, newPrompt];
    setPrompts(updatedPrompts);
    saveCustomPrompts(updatedPrompts.filter(p => p.isCustom));
    setNewPromptText('');
  };

  const updatePrompt = (promptId: string, newText: string) => {
    const updatedPrompts = prompts.map(p => 
      p.id === promptId ? { ...p, text: newText } : p
    );
    setPrompts(updatedPrompts);
    saveCustomPrompts(updatedPrompts.filter(p => p.isCustom));
    setEditingPrompt(null);
  };

  const deletePrompt = (promptId: string) => {
    const updatedPrompts = prompts.filter(p => p.id !== promptId);
    setPrompts(updatedPrompts);
    saveCustomPrompts(updatedPrompts.filter(p => p.isCustom));
  };

  const toggleFavorite = (promptId: string) => {
    const updatedPrompts = prompts.map(p => 
      p.id === promptId ? { ...p, isFavorite: !p.isFavorite } : p
    );
    setPrompts(updatedPrompts);
    saveCustomPrompts(updatedPrompts.filter(p => p.isCustom));
  };

  const has10K = selectedFilings.some(f => f.form?.includes('10-K') || f.type?.includes('10-K'));
  const has10Q = selectedFilings.some(f => f.form?.includes('10-Q') || f.type?.includes('10-Q'));

  const filteredPrompts = prompts.filter(prompt => {
    const searchMatch = prompt.text.toLowerCase().includes(promptSearch.toLowerCase()) ||
                        prompt.category.toLowerCase().includes(promptSearch.toLowerCase());

    if (!searchMatch) return false;

    switch (activeTab) {
      case '10-K':
        return prompt.filingType === '10-K' || prompt.filingType === 'common';
      case '10-Q':
        return prompt.filingType === '10-Q' || prompt.filingType === 'common';
      case 'Custom':
        return prompt.isCustom;
      case 'All':
      default:
        return !prompt.isCustom;
    }
  });

  const groupedPrompts = filteredPrompts.reduce((acc, prompt) => {
    const key = prompt.isCustom ? 'Custom Prompts' : prompt.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(prompt);
    return acc;
  }, {} as Record<string, Prompt[]>);

  const handlePromptSelect = (prompt: Prompt) => {
    handleSubmit(prompt.text);
    setShowPromptDropdown(false);
    setPromptSearch('');
  };

  // Remove the initial message - let users start with a clean slate
  useEffect(() => {
    // No initial message anymore
  }, [companyName, loading, messages.length]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setModels(await OpenRouterService.getModels());
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };
    fetchModels();
  }, []);

  // Fetch user's default models and agent personas
  useEffect(() => {
    const fetchUserDefaults = async () => {
      try {
        const response = await fetch('/api/user/models');
        if (response.ok) {
          const data = await response.json();
          if (!defaultsLoaded) {
            setSelectedModel(data.defaultChatModel || 'google/gemini-2.0-flash-exp:free');
            setSelectedAnalysisModel(data.defaultAgentModel || 'openai/gpt-4o');
            setSelectedAgentPersonas(data.defaultAgentPersonas || []);
            setDefaultsLoaded(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user defaults:', error);
        // Fallback to hardcoded defaults if fetch fails
        if (!defaultsLoaded) {
          setSelectedModel('google/gemini-2.0-flash-exp:free');
          setSelectedAnalysisModel('openai/gpt-4o');
          setSelectedAgentPersonas([]);
          setDefaultsLoaded(true);
        }
      }
    };
    
    fetchUserDefaults();
  }, [defaultsLoaded]);

  useEffect(() => {
    // Get API key from localStorage or session
    const storedApiKey = localStorage.getItem('openrouter_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  useEffect(() => {
    // Update analysis agent's default model when changed
    analysisAgent.setDefaultModel(selectedAnalysisModel);
  }, [selectedAnalysisModel]);

  useEffect(() => {
    // Update analysis agent's active personas when changed
    analysisAgent.setActiveAgents(selectedAgentPersonas);
  }, [selectedAgentPersonas]);

  // Improved scroll behavior
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current && isAutoScrollEnabled) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, [isAutoScrollEnabled]);

  useEffect(() => {
    // Use a small delay to ensure the DOM is fully rendered before scrolling
    const scrollTimeout = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(scrollTimeout);
  }, [messages, scrollToBottom]);

  // Handle scroll position for auto-scroll toggle
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setIsAutoScrollEnabled(isNearBottom);
    setShowScrollToBottom(!isNearBottom && messages.length > 0);
  }, [messages.length]);
  
  // Additional scroll on component mount to ensure initial visibility
  useEffect(() => {
    // Scroll when component mounts or filing changes
    const mountTimeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
    
    return () => clearTimeout(mountTimeout);
  }, [filing.symbol]); // Trigger when company (filing) changes

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!chatId) return;
      try {
        const response = await fetch(`/api/chat/${chatId}`);
        if (!response.ok) throw new Error('Failed to fetch chat history');
        const data = await response.json();
        if (data.messages?.length) {
          setMessages(data.messages.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp || Date.now()) })));
        }
        if (data.filing?.filings?.length) {
          setSelectedFilings(data.filing.filings);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    loadChatHistory();
  }, [chatId]);

  const formatTimestamp = (date: Date): string => {
    try {
      if (!(date instanceof Date) || isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);
    } catch {
      return '';
    }
  };

  const handleSubmit = useCallback(async (question?: string) => {
    const content = (question || input).trim();
    if (!content || loading || !selectedFilings.length) return;

    // Check if analysis mode is enabled and no agents are selected
    if (analysisMode && selectedAgentPersonas.length === 0) {
      setPendingQuestion(content);
      setShowAgentSelectionDialog(true);
      if (!question) setInput(''); // Clear input
      return;
    }

    setLoading(true);
    const newMessage: Message = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    if (!question) setInput(''); // Only clear input if not using a suggestion

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          messages: [...messages, newMessage].map(m => ({ role: m.role, content: m.content })),
          filings: selectedFilings,
          chatId,
          model: isWebSearchEnabled ? `${selectedModel}:online` : selectedModel,
          analysisModel: selectedAnalysisModel,
          enableAnalysis: analysisMode && selectedAgentPersonas.length > 0,
          agentPersonas: selectedAgentPersonas,
          agentModels: agentModels
        })
      });

      if (!response.ok || !response.body) throw new Error((await response.json().catch(() => ({}))).error || 'Unknown error');

      // Add the streaming message placeholder
      const messageIndex = messages.length + 1;
      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date(), annotations: [] }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let chatIdFound = false;
      let lastMessageContent = '';
      let lastUpdateTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        if (!chatIdFound) {
          const match = buffer.match(/<chatId>(.*?)<\/chatId>/);
          if (match) {
            const newChatId = match[1];
            setChatId(newChatId);
            window.history.pushState({}, '', `${window.location.pathname}?chatId=${newChatId}`);
            chatIdFound = true;
          }
        }
        
        // Throttle updates to prevent excessive re-renders
        const now = Date.now();
        if (now - lastUpdateTime > 50) { // Update at most every 50ms
          const cleanedText = buffer.replace(/<chatId>.*?<\/chatId>/, '');
          
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[messageIndex];
            if (lastMessage && lastMessage.role === 'assistant') {
              try {
                const parsed = JSON.parse(cleanedText);
                lastMessage.content = parsed.content || '';
                lastMessage.annotations = parsed.annotations || [];
              } catch {
                lastMessage.content = cleanedText;
              }
              lastMessageContent = lastMessage.content;
            }
            return newMessages;
          });
          
          lastUpdateTime = now;
        }
      }
      
      // Final update to ensure all content is displayed
      const cleanedText = buffer.replace(/<chatId>.*?<\/chatId>/, '');
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[messageIndex];
        if (lastMessage && lastMessage.role === 'assistant') {
          try {
            const parsed = JSON.parse(cleanedText);
            lastMessage.content = parsed.content || '';
            lastMessage.annotations = parsed.annotations || [];
          } catch {
            lastMessage.content = cleanedText;
          }
          lastMessageContent = lastMessage.content;
        }
        return newMessages;
      });
      if (autoRead && lastMessageContent) {
        speak(EnhancedMessageFormatter.formatForSpeech(lastMessageContent), selectedVoice, speakingRate);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${error instanceof Error ? error.message : 'An unknown error occurred.'}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, selectedFilings, analysisMode, selectedAgentPersonas, messages, chatId, selectedModel, selectedAnalysisModel, agentModels, isWebSearchEnabled, autoRead, selectedVoice, speakingRate, speak]);

  const handleFilingSelect = async (secFiling: SECFiling) => {
    if (selectedFilings.some(f => f.accessionNumber === secFiling.accessionNumber)) return;
    setShowFilingSelector(false);
    try {
      const response = await fetch(`/api/sec?docUrl=${encodeURIComponent(secFiling.textUrl)}`);
      if (!response.ok) throw new Error('Failed to fetch filing content');
      const { content } = await response.json();
      const newFiling: Filing = { ...secFiling, content, companyName: companyName || '', type: secFiling.form, symbol: filing.symbol };
      setSelectedFilings(prev => [...prev, newFiling]);
      setMessages(prev => [...prev, { role: 'assistant', content: `Added **${secFiling.form}** filed on ${secFiling.filingDate}.`, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Failed to load filing.`, timestamp: new Date() }]);
    }
  };

  const removeFiling = (accessionNumber: string) => {
    if (selectedFilings.length <= 1) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'At least one filing is required.', timestamp: new Date() }]);
      return;
    }
    const filingToRemove = selectedFilings.find(f => f.accessionNumber === accessionNumber);
    if (filingToRemove) {
      setSelectedFilings(prev => prev.filter(f => f.accessionNumber !== accessionNumber));
      setMessages(prev => [...prev, { role: 'assistant', content: `Removed **${filingToRemove.form}**.`, timestamp: new Date() }]);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    // Apply enhanced formatting with all features
    let formattedContent = message.content;
    
    // Extract filing citations from the content
    const filingCitations: string[] = [];
    const citedFilings = new Set<string>(); // Use a Set to track unique citations
    
    // Pattern to detect filing references (e.g., "10-K", "10-Q", "8-K", etc.)
    const filingPattern = /\b(10-K|10-Q|8-K|DEF 14A|20-F|40-F|S-1|S-3|S-4|S-8|424B\d*)\b/gi;
    const matches = formattedContent.match(filingPattern);
    
    if (matches && message.role === 'assistant') {
      // Find which of our loaded filings match the references
      matches.forEach(match => {
        const matchingFiling = selectedFilings.find(f => 
          f.form.toUpperCase().includes(match.toUpperCase())
        );
        if (matchingFiling) {
          const citationKey = `${matchingFiling.form}_${matchingFiling.filingDate}`;
          if (!citedFilings.has(citationKey)) {
            citedFilings.add(citationKey);
            filingCitations.push(`${matchingFiling.form} (${matchingFiling.filingDate})`);
          }
        }
      });
      
      // Add citation indicators to the content
      formattedContent = formattedContent.replace(filingPattern, (match) => {
        const matchingFiling = selectedFilings.find(f => 
          f.form.toUpperCase().includes(match.toUpperCase())
        );
        if (matchingFiling) {
          return `**${match}**`;
        }
        return match;
      });
    }
    
    if (message.annotations) {
        message.annotations.forEach(annotation => {
            if (annotation.type === 'url_citation') {
                const { url, title, start_index, end_index } = annotation.url_citation;
                const originalText = formattedContent.substring(start_index, end_index);
                formattedContent = formattedContent.replace(originalText, `[${title || 'source'}](${url})`);
            }
        });
    }

    // Extract analysis content if analysis mode is enabled
    let analysisContent = '';
    if (analysisMode && selectedAgentPersonas.length > 0 && message.role === 'assistant' && companyName && apiKey) {
      analysisContent = analysisAgent.quickAnalysis(formattedContent, companyName);
      
      // Update the current analysis state for the right panel
      if (index === messages.length - 1) { // Only for the latest message
        setCurrentAnalysis(analysisContent);
      }
    }

    const isUser = message.role === 'user';
    
    return (
      <div key={index} className={cn("flex items-start gap-3 group", isUser && "justify-end")}>
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 mt-0.5 rounded-full bg-blue-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
        <div className={cn("flex flex-col flex-1", isUser ? "items-end" : "items-start")}>
          <div className={cn(
            "relative px-5 py-4 rounded-xl shadow-sm transition-all duration-200",
            isUser 
              ? "bg-blue-600 text-white max-w-2xl" 
              : "bg-slate-800/60 text-slate-100 border border-slate-700/30 backdrop-blur-sm"
          )}>
            <ReactMarkdown
              className={cn(
                "prose max-w-none prose-invert",
                "prose-p:text-slate-200 prose-p:leading-7 prose-p:mb-3",
                "prose-headings:text-slate-100 prose-headings:font-semibold",
                "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
                "prose-strong:text-blue-400 prose-strong:font-semibold",
                "prose-ul:space-y-2 prose-li:text-slate-200",
                "prose-code:text-blue-300 prose-code:bg-slate-900/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
              )}
              components={{
                code: ({node, ...props}: any) => {
                  const inline = node?.position ? (node.position.end.line === node.position.start.line) : false;
                  return inline ? <code className="font-mono text-sm" {...props} /> : <CodeBlock {...props} />;
                },
                a: ({node, ...props}) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" />
                ),
                h1: ({node, ...props}) => <h1 className="mb-4 mt-6 first:mt-0 font-semibold" {...props} />,
                h2: ({node, ...props}) => <h2 className="mb-3 mt-5 first:mt-0 font-semibold" {...props} />,
                h3: ({node, ...props}) => <h3 className="mb-2 mt-4 first:mt-0 font-semibold" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="mb-4 space-y-2 list-disc list-inside" {...props} />,
                ol: ({node, ...props}) => <ol className="mb-4 space-y-2 list-decimal list-inside" {...props} />,
                li: ({node, ...props}) => <li className="ml-4 leading-relaxed" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="my-4 border-l-4" {...props} />,
                hr: ({node, ...props}) => <hr className="my-6 border-slate-700/50" {...props} />,
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-6 rounded-lg border border-slate-700/50">
                    <table className="w-full text-sm" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => (
                  <thead className="bg-slate-900/50 border-b border-slate-700" {...props} />
                ),
                tbody: ({node, ...props}) => (
                  <tbody className="divide-y divide-slate-700/30" {...props} />
                ),
                tr: ({node, ...props}) => (
                  <tr className="hover:bg-slate-800/30 transition-colors" {...props} />
                ),
                th: ({node, ...props}) => (
                  <th className="px-4 py-3 text-left font-semibold text-slate-200 whitespace-nowrap" {...props} />
                ),
                td: ({node, ...props}) => (
                  <td className="px-4 py-3 text-slate-300 font-mono text-sm" {...props} />
                ),
                em: ({node, ...props}) => (
                  <em className="italic text-slate-300" {...props} />
                ),
                strong: ({node, ...props}) => (
                  <strong className="font-semibold text-blue-400" {...props} />
                ),
              }}
            >
              {formattedContent}
            </ReactMarkdown>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span>{formatTimestamp(message.timestamp)}</span>
            {!isUser && (
              <>
                <button
                  onClick={() => navigator.clipboard.writeText(message.content)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-800 rounded"
                  title="Copy message"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {isTTSAvailable && (
                  <button
                    onClick={() => handleSpeakerClick(message.content, `${index}`)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-800 rounded"
                    title={isSpeaking && currentlyPlaying === `${index}` ? "Stop" : "Read aloud"}
                  >
                    {isSpeaking && currentlyPlaying === `${index}` ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                )}
              </>
            )}
          </div>
          
          {/* Filing Citations */}
          {!isUser && filingCitations.length > 0 && (
            <div className="mt-3 flex items-start gap-2">
              
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-400">Sources:</span>
                {filingCitations.map((citation, idx) => {
                  const filing = selectedFilings.find(f => 
                    citation.includes(f.form) && citation.includes(f.filingDate)
                  );
                  return (
                    <button
                      key={idx}
                      onClick={() => filing && window.open(filing.htmlUrl, '_blank')}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all"
                      title={filing ? "View on SEC.gov" : citation}
                    >
                      
                      {citation}
                      
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 mt-0.5 rounded-full bg-slate-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-[#0B0E14] text-white relative">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-14 px-4 flex items-center bg-[#0B0E14] border-b border-slate-800 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">{companyName} ({filing.symbol})</h2>
            {stockInfo && (
              <div className="flex items-center gap-4">
                {/* Current Price */}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">${stockInfo.price}</span>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium",
                    stockInfo.change.startsWith('-') 
                      ? "bg-red-500/20 text-red-400" 
                      : "bg-green-500/20 text-green-400"
                  )}>
                    <span>{stockInfo.change.startsWith('-') ? '' : '+'}{stockInfo.change}</span>
                    <span>({stockInfo.changePercent})</span>
                  </div>
                </div>
                
                {/* Additional Stock Info */}
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {stockInfo.dayRange && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Day Range:</span>
                      <span className="text-slate-300">{stockInfo.dayRange}</span>
                    </div>
                  )}
                  {stockInfo.volume && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Vol:</span>
                      <span className="text-slate-300">{stockInfo.volume}</span>
                    </div>
                  )}
                  {stockInfo.marketCap && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Mkt Cap:</span>
                      <span className="text-slate-300">{stockInfo.marketCap}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <a
              href={`https://finance.yahoo.com/quote/${filing.symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-400 hover:underline ml-auto"
            >
              Yahoo Finance <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Messages Container with proper scrolling - Added top padding for navbar */}
        <div className="absolute inset-0 pt-14 pb-[140px] overflow-hidden">
          <div 
            ref={messagesContainerRef}
            className="h-full overflow-y-auto"
            onScroll={handleScroll}
          >
            <div className="p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 pt-20">
                  <p className="text-lg">Chat with your SEC filing.</p>
                  <p className="text-sm">Use the suggestions below or ask your own questions.</p>
                </div>
              )}
              {messages.map(renderMessage)}
              {loading && (
                <div className="flex items-start gap-3 animate-in fade-in duration-300">
                  <div className="flex-shrink-0 w-8 h-8 mt-0.5 rounded-full bg-blue-600 flex items-center justify-center">
                    <div className="relative">
                      <Bot className="w-4 h-4 text-white" />
                      <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping" />
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-slate-800/90 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-slate-300">Processing your request...</span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Scroll to bottom button */}
          {showScrollToBottom && (
            <button
              onClick={() => {
                scrollToBottom();
                setIsAutoScrollEnabled(true);
              }}
              className="absolute bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 animate-in fade-in slide-in-from-bottom-2"
              title="Scroll to bottom"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0B0E14] border-t border-slate-800">
          {/* Prompt Dropdown */}
          {!loading && (
            <div className="mb-3 relative" ref={promptDropdownRef}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPromptDropdown(!showPromptDropdown)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-all"
                >
                  
                  <span>Suggested prompts ({prompts.length})</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showPromptDropdown && "rotate-180")} />
                </button>
                
              </div>

              {showPromptDropdown && (
                <div className="absolute bottom-full mb-2 left-0 w-[600px] max-h-[50vh] bg-slate-800 border border-slate-700 rounded-lg shadow-xl flex flex-col z-50">
                  {/* Header with Search and Tabs */}
                  <div className="p-3 border-b border-slate-700">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={promptSearch}
                        onChange={(e) => setPromptSearch(e.target.value)}
                        placeholder="Search prompts..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div className="flex items-center border-b border-slate-700">
                      {['All', '10-K', '10-Q', 'Custom'].map(tab => {
                        // Only disable tabs if we have filings and they don't match
                        const isDisabled = selectedFilings.length > 0 && (
                          (tab === '10-K' && !has10K) || 
                          (tab === '10-Q' && !has10Q)
                        );
                        
                        return (
                          <button
                            key={tab}
                            onClick={() => !isDisabled && setActiveTab(tab as any)}
                            disabled={isDisabled}
                            className={cn(
                              "px-4 py-2 text-sm font-medium transition-colors",
                              activeTab === tab ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-white",
                              isDisabled && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prompts List */}
                  <div className="overflow-y-auto flex-1">
                    {Object.entries(groupedPrompts).length > 0 ? Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
                      <div key={category} className="border-b border-slate-700/50 last:border-0">
                        <div className="px-4 py-2 bg-slate-900/30 sticky top-0">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{category}</h4>
                        </div>
                        <div className="p-2">
                          {categoryPrompts.map(prompt => (
                            <div
                              key={prompt.id}
                              className="group flex items-center gap-2 px-3 py-2.5 hover:bg-slate-700/50 rounded-md transition-colors cursor-pointer"
                              onClick={() => handlePromptSelect(prompt)}
                            >
                              {editingPrompt?.id === prompt.id ? (
                                <input
                                  type="text"
                                  defaultValue={prompt.text}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updatePrompt(prompt.id, e.currentTarget.value);
                                    } else if (e.key === 'Escape') {
                                      setEditingPrompt(null);
                                    }
                                  }}
                                  onBlur={(e) => updatePrompt(prompt.id, e.currentTarget.value)}
                                  className="flex-1 px-2 py-1 text-sm bg-slate-900/50 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <>
                                  <Lightbulb className="w-4 h-4 text-yellow-400/80 flex-shrink-0" />
                                  <span className="flex-1 text-sm text-slate-200">{prompt.text}</span>
                                  {prompt.isCustom && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setEditingPrompt(prompt); }}
                                        className="p-1.5 hover:bg-slate-600 rounded-md"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); deletePrompt(prompt.id); }}
                                        className="p-1.5 hover:bg-red-500/20 rounded-md"
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
                    )) : (
                      <div className="p-6 text-center text-slate-400">
                        <p>No prompts found.</p>
                        {activeTab === 'Custom' && <p className="text-xs mt-2">Add your first custom prompt below!</p>}
                      </div>
                    )}
                  </div>
                  
                  {/* Add New Prompt Section */}
                  {activeTab === 'Custom' && (
                    <div className="p-3 border-t border-slate-700 bg-slate-900/30">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPromptText}
                          onChange={(e) => setNewPromptText(e.target.value)}
                          placeholder="Add a new custom prompt..."
                          className="flex-1 px-3 py-2 text-sm bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomPrompt();
                            }
                          }}
                        />
                        <button
                          onClick={addCustomPrompt}
                          disabled={!newPromptText.trim()}
                          className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="relative flex items-center gap-3">
            {isSpeechRecognitionAvailable && (
              <button onClick={handleMicClick} className={cn("p-3 text-white transition-all rounded-lg", isListening ? "bg-red-600 hover:bg-red-500" : "bg-slate-700 hover:bg-slate-600")}>
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder={isListening ? "Listening..." : `Ask about ${companyName || 'the filings'}...`}
              className="flex-1 px-4 py-3 text-white transition-colors rounded-lg bg-slate-800/80 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 resize-none"
              rows={1}
            />
            <button onClick={() => handleSubmit()} disabled={loading || !input.trim()} className="p-3 text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-600">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Compact Control Panel */}
      <div className="w-80 flex-shrink-0 bg-slate-900/70 border-l border-slate-800 hidden md:block relative">
        <div className="absolute inset-0 p-3 overflow-y-auto">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Controls</h3>
              <button
                onClick={async () => {
                  try {
                    await PDFExporter.exportChatToPDF(messages, companyName || 'SEC Filing Analysis');
                  } catch (error) {
                    console.error('Failed to export PDF:', error);
                  }
                }}
                className="p-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                title="Export PDF"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>

            {/* Compact Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-slate-800/60 rounded">
                <div className="flex items-center gap-2">
                  <Globe className={cn("w-4 h-4", isWebSearchEnabled ? "text-blue-400" : "text-slate-500")} />
                  <span className="text-xs text-slate-300">Web Search</span>
                </div>
                <button
                  onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                  className={cn("w-8 h-4 rounded-full transition-colors", isWebSearchEnabled ? 'bg-blue-600' : 'bg-slate-600')}
                >
                  <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", isWebSearchEnabled ? 'translate-x-4' : 'translate-x-0.5')} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-800/60 rounded">
                <div className="flex items-center gap-2">
                  <BrainCircuit className={cn("w-4 h-4", analysisMode ? "text-purple-400" : "text-slate-500")} />
                  <span className="text-xs text-slate-300">Multi-Agent</span>
                </div>
                <button
                  onClick={() => {
                    setAnalysisMode(!analysisMode);
                    if (!analysisMode) setSelectedAgentPersonas([]);
                  }}
                  className={cn("w-8 h-4 rounded-full transition-colors", analysisMode ? 'bg-purple-600' : 'bg-slate-600')}
                >
                  <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", analysisMode ? 'translate-x-4' : 'translate-x-0.5')} />
                </button>
              </div>

              {isTTSAvailable && (
                <div className="flex items-center justify-between p-2 bg-slate-800/60 rounded">
                  <div className="flex items-center gap-2">
                    <Volume2 className={cn("w-4 h-4", autoRead ? "text-green-400" : "text-slate-500")} />
                    <span className="text-xs text-slate-300">Auto-Read</span>
                  </div>
                  <button
                    onClick={() => setAutoRead(!autoRead)}
                    className={cn("w-8 h-4 rounded-full transition-colors", autoRead ? 'bg-green-600' : 'bg-slate-600')}
                  >
                    <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", autoRead ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                </div>
              )}
            </div>

            {/* Models */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Models</h4>
              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onModelSelect={setSelectedModel}
                label="Chat"
                className="w-full"
              />
              
              {analysisMode && (
                <div className="space-y-2 p-2 bg-slate-800/30 rounded border border-slate-700/50">
                  <ModelSelector
                    models={models}
                    selectedModel={selectedAnalysisModel}
                    onModelSelect={setSelectedAnalysisModel}
                    label="Analysis"
                    className="w-full"
                  />
                  <AgentDropdown
                    selectedAgents={selectedAgentPersonas}
                    onAgentsChange={setSelectedAgentPersonas}
                    className="w-full"
                    label="Agents"
                    placeholder="Select perspectives"
                  />
                </div>
              )}
            </div>

            {/* Filings */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Filings</h4>
              <div className="space-y-1">
                {selectedFilings.map((f) => (
                  <div key={f.accessionNumber} className="flex items-center justify-between p-2 bg-slate-800/40 rounded text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-slate-200 truncate">{f.form}</div>
                        <div className="text-slate-500 text-xs">{f.filingDate}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a href={f.htmlUrl} target="_blank" className="p-1 hover:bg-slate-700 rounded">
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                      {selectedFilings.length > 1 && (
                        <button onClick={() => removeFiling(f.accessionNumber)} className="p-1 hover:bg-red-500/20 rounded">
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowFilingSelector(true)}
                  className="w-full p-2 bg-slate-800/20 hover:bg-slate-800/40 border border-dashed border-slate-700 rounded transition-colors flex items-center justify-center gap-1 text-xs text-slate-400"
                >
                  <Plus className="w-3 h-3" />
                  Add Filing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filing Selector Modal */}
      {showFilingSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Add Filing</h2>
                <button
                  onClick={() => setShowFilingSelector(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-3">
                {filings.filter(f => !selectedFilings.some(sf => sf.accessionNumber === f.accessionNumber)).map((f) => (
                  <button
                    key={f.accessionNumber}
                    onClick={() => handleFilingSelect(f as SECFiling)}
                    className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{f.form}</div>
                        <div className="text-sm text-slate-400">{f.filingDate}</div>
                        {(f as any).description && (
                          <div className="text-xs text-slate-500 mt-1">{(f as any).description}</div>
                        )}
                      </div>
                      <Plus className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Selection Dialog */}
      <AgentSelectionDialog
        isOpen={showAgentSelectionDialog}
        onClose={() => {
          setShowAgentSelectionDialog(false);
          setPendingQuestion('');
        }}
        onConfirm={(agents) => {
          setSelectedAgentPersonas(agents);
          setShowAgentSelectionDialog(false);
          if (pendingQuestion) {
            handleSubmit(pendingQuestion);
            setPendingQuestion('');
          }
        }}
        preSelectedAgents={selectedAgentPersonas}
        question={pendingQuestion}
      />
    </div>
  );
}
