'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEnhancedAgentConversation } from '@/lib/hooks/use-enhanced-agent-conversation';
import { AGENT_PERSONAS } from '@/lib/services/agent-personas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Play,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  MessageSquare,
  Users,
  Settings,
  Zap,
  Brain,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';

interface EnhancedAgentConversationProps {
  symbol: string;
  companyName?: string;
  filings: any[];
  selectedModel: string;
  agentModels: Record<string, string>;
  apiKey: string;
  className?: string;
}

export function EnhancedAgentConversation({
  symbol,
  companyName,
  filings,
  selectedModel,
  agentModels,
  apiKey,
  className = ''
}: EnhancedAgentConversationProps) {
  const {
    messages,
    conversationState,
    typingAgents,
    thinkingAgents,
    currentlyPlaying,
    conversationScript,
    isGeneratingScript,
    startConversation,
    stopConversation,
    resetConversation,
    updateConversationState,
    stopAllAudio,
    askAgent,
    CONVERSATION_TOPICS,
  } = useEnhancedAgentConversation();

  const [selectedAgents, setSelectedAgents] = useState<string[]>(['bull', 'bear', 'balanced']);
  const [isMuted, setIsMuted] = useState(false);
  const [rounds, setRounds] = useState(3);
  const [showSettings, setShowSettings] = useState(true);
  const [directQuestion, setDirectQuestion] = useState('');
  const [selectedQuestionAgent, setSelectedQuestionAgent] = useState<string>('');
  const [isAsking, setIsAsking] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      } else if (prev.length < 5) {
        return [...prev, agentId];
      }
      return prev;
    });
  };

  const handleStartConversation = () => {
    if (selectedAgents.length < 2) {
      alert('Please select at least 2 agents for a conversation');
      return;
    }
    startConversation(selectedAgents, symbol, companyName, selectedModel, agentModels, filings, apiKey, isMuted, rounds);
  };

  const handleAskAgent = async () => {
    if (!directQuestion.trim() || !selectedQuestionAgent) {
      alert('Please enter a question and select an agent');
      return;
    }
    setIsAsking(true);
    await askAgent(selectedQuestionAgent, directQuestion, isMuted);
    setDirectQuestion('');
    setIsAsking(false);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAgentIcon = (agentId: string) => {
    const icons: Record<string, string> = {
      bull: '🐂', bear: '🐻', balanced: '⚖️', skeptic: '🤔', technical: '📊',
      macro: '🌍', risk: '🛡️', growth: '🚀', value: '💎', contrarian: '🔄', moderator: '🎯'
    };
    return icons[agentId] || '🤖';
  };

  const AgentAvatar = ({ agentId }: { agentId: string }) => (
    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg flex-shrink-0">
      {getAgentIcon(agentId)}
    </div>
  );

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-950 rounded-lg border-4 border-red-500 shadow-lg ${className}`}>
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-blue-500" />
          <div>
            <CardTitle className="text-lg font-semibold">Enhanced Agent Conversation</CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI-powered analyst discussion for {companyName || symbol}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversationState.isActive && (
            <Badge variant="default" className="animate-pulse bg-green-500 text-white">
              Live
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Agent Selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4" /> Select Agents (2-5)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(AGENT_PERSONAS).map(([agentId, persona]) => (
                  <div key={agentId} className="flex items-center space-x-2 p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <Checkbox id={agentId} checked={selectedAgents.includes(agentId)} onCheckedChange={() => handleAgentToggle(agentId)} disabled={conversationState.isActive} />
                    <label htmlFor={agentId} className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                      <span>{getAgentIcon(agentId)}</span> {persona.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2"><Settings className="h-4 w-4" /> Conversation</h4>
              <div className="space-y-2">
                <label className="text-xs font-medium">Topic</label>
                <Select value={conversationState.topic} onChange={(e) => updateConversationState({ topic: e.target.value })} disabled={conversationState.isActive}>
                  {CONVERSATION_TOPICS.map(topic => <option key={topic} value={topic}>{topic}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Rounds: {rounds}</label>
                <Slider value={[rounds]} onValueChange={(value) => setRounds(value[0])} min={2} max={5} step={1} disabled={conversationState.isActive} />
              </div>
            </div>

            {/* Audio Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2"><Volume2 className="h-4 w-4" /> Audio</h4>
              <div className="space-y-2">
                <label className="text-xs font-medium">Speed: {conversationState.speed.toFixed(1)}x</label>
                <Slider value={[conversationState.speed]} onValueChange={(value) => updateConversationState({ speed: value[0] })} min={0.5} max={2.0} step={0.1} />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="muted" checked={isMuted} onCheckedChange={(checked) => setIsMuted(Boolean(checked))} />
                <label htmlFor="muted" className="text-sm font-medium cursor-pointer">Mute Audio</label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          {!conversationState.isActive ? (
            <Button onClick={handleStartConversation} disabled={selectedAgents.length < 2 || isGeneratingScript} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Play className="h-4 w-4 mr-2" />
              {isGeneratingScript ? 'Generating Script...' : 'Start Discussion'}
            </Button>
          ) : (
            <Button onClick={stopConversation} variant="destructive">
              <Square className="h-4 w-4 mr-2" />
              Stop Discussion
            </Button>
          )}
          <Button onClick={resetConversation} variant="outline" disabled={conversationState.isActive}><RotateCcw className="h-4 w-4 mr-2" /> Reset</Button>
          <Button onClick={stopAllAudio} variant="outline">
            {currentlyPlaying ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
            {currentlyPlaying ? 'Stop Audio' : 'Mute'}
          </Button>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 ml-auto">
            <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {selectedAgents.length} agents</div>
            {conversationState.round > 0 && <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Round {conversationState.round}</div>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold">Ready for Analysis</h3>
              <p className="text-sm">Start a discussion to see AI agents analyze {symbol}.</p>
            </div>
          ) : (
              messages.map((message) => {
                const agent = AGENT_PERSONAS[message.agentId];
                const isCurrentlyPlaying = currentlyPlaying === message.id;
                const isTyping = typingAgents.has(message.agentId);
                const isThinking = thinkingAgents.has(message.agentId);
              const isModerator = message.agentId === 'moderator';

              return (
                <div key={message.id} className={`flex items-start gap-3 ${isModerator ? 'justify-center' : ''}`}>
                  {!isModerator && <AgentAvatar agentId={message.agentId} />}
                  <div className={`w-full max-w-3xl ${isModerator ? 'text-center' : ''}`}>
                    {!isModerator && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold text-sm ${agent?.color || 'text-gray-800 dark:text-gray-200'}`}>{agent?.name || 'Agent'}</span>
                        {message.round && <Badge variant="outline" className="text-xs">R{message.round}</Badge>}
                        {message.model && <Badge variant="secondary" className="text-xs">{message.model.split('/').pop()}</Badge>}
                        {isThinking && <Badge variant="outline" className="text-xs animate-pulse">Thinking...</Badge>}
                        {isTyping && <Badge variant="default" className="text-xs animate-pulse">Typing...</Badge>}
                      </div>
                    )}
                    <div className={`p-3 rounded-lg ${isModerator
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-center'
                        : `border ${agent?.bgColor} ${agent?.borderColor}`
                      } ${isCurrentlyPlaying ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className={`text-xs text-gray-400 mt-1 flex items-center gap-2 ${isModerator ? 'justify-center' : ''}`}>
                      <span>{formatTimestamp(message.timestamp)}</span>
                      {message.responseTime && <span>({message.responseTime}ms)</span>}
                      {isCurrentlyPlaying && <Volume2 className="h-3 w-3 text-blue-500 animate-pulse" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Direct Question Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-start gap-3">
            <AgentAvatar agentId={selectedQuestionAgent || 'moderator'} />
            <div className="flex-1 space-y-2">
              <Select value={selectedQuestionAgent} onChange={(e) => setSelectedQuestionAgent(e.target.value)} disabled={!conversationState.isActive}>
                <option value="">Select an agent to ask a question</option>
                {selectedAgents.map(agentId => (
                  <option key={agentId} value={agentId}>
                    {AGENT_PERSONAS[agentId]?.name}
                  </option>
                ))}
              </Select>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask a follow-up question..."
                  value={directQuestion}
                  onChange={(e) => setDirectQuestion(e.target.value)}
                  className="flex-1"
                  rows={1}
                  disabled={!conversationState.isActive || !selectedQuestionAgent}
                />
                <Button onClick={handleAskAgent} disabled={!directQuestion.trim() || !selectedQuestionAgent || isAsking}>
                  {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
