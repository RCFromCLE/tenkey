'use client';

import React, { useState } from 'react';
import { EnhancedAgentConversation } from '@/components/filing/EnhancedAgentConversation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, MessageSquare } from 'lucide-react';

export default function TestEnhancedAgentConversationPage() {
  const [selectedModel, setSelectedModel] = useState('openrouter/anthropic/claude-3.5-sonnet');
  const [apiKey, setApiKey] = useState('');

  // Mock agent models configuration
  const agentModels = {
    bull: 'openrouter/anthropic/claude-3.5-sonnet',
    bear: 'openrouter/meta-llama/llama-3.1-70b-instruct',
    balanced: 'openrouter/openai/gpt-4o',
    skeptic: 'openrouter/anthropic/claude-3.5-sonnet',
    technical: 'openrouter/openai/gpt-4o',
    macro: 'openrouter/meta-llama/llama-3.1-70b-instruct',
    risk: 'openrouter/anthropic/claude-3.5-sonnet',
    growth: 'openrouter/openai/gpt-4o',
    value: 'openrouter/meta-llama/llama-3.1-70b-instruct',
    contrarian: 'openrouter/anthropic/claude-3.5-sonnet'
  };

  // Mock filings data
  const mockFilings = [
    {
      id: '1',
      type: '10-K',
      date: '2024-03-15',
      title: 'Annual Report',
      content: 'Sample filing content for testing...'
    },
    {
      id: '2',
      type: '10-Q',
      date: '2024-06-15',
      title: 'Quarterly Report',
      content: 'Sample quarterly filing content...'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-500" />
              Enhanced Agent Conversation Test
              <Badge variant="outline" className="ml-2">
                OpenRouter + OpenAI TTS Integration
              </Badge>
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Test the enhanced agent conversation system with OpenRouter models for agent communication and OpenAI for text-to-speech.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                OpenRouter API Key (Required for agent conversations)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenRouter API key..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenRouter.ai</a>
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white [&>option]:bg-white [&>option]:text-black dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
              >
                <option value="openrouter/anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                <option value="openrouter/openai/gpt-4o">GPT-4o</option>
                <option value="openrouter/meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                <option value="openrouter/google/gemini-pro-1.5">Gemini Pro 1.5</option>
              </select>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Zap className="h-6 w-6 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">OpenRouter Integration</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Agents communicate using diverse OpenRouter models for varied perspectives
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100">OpenAI TTS</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Natural speech synthesis with unique voices for each agent
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Brain className="h-6 w-6 text-purple-500 mt-1" />
                <div>
                  <h3 className="font-medium text-purple-900 dark:text-purple-100">Smart Orchestration</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Dynamic conversation flow with intelligent agent selection
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Agent Conversation Component */}
        {apiKey ? (
          <EnhancedAgentConversation
            symbol="AAPL"
            companyName="Apple Inc."
            filings={mockFilings}
            selectedModel={selectedModel}
            agentModels={agentModels}
            apiKey={apiKey}
          />
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                API Key Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please enter your OpenRouter API key above to test the enhanced agent conversation system.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">OpenRouter Models Used:</h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Claude 3.5 Sonnet - Bull, Skeptic, Risk, Contrarian agents</li>
                  <li>• GPT-4o - Balanced, Technical, Growth agents</li>
                  <li>• Llama 3.1 70B - Bear, Macro, Value agents</li>
                  <li>• Dynamic model assignment per agent</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">OpenAI TTS Voices:</h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Coral - Bull (energetic)</li>
                  <li>• Onyx - Bear (commanding)</li>
                  <li>• Alloy - Balanced (neutral)</li>
                  <li>• Echo - Skeptic (questioning)</li>
                  <li>• Sage - Technical (knowledgeable)</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">Key Features:</h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>✅ Conversation script generation using OpenRouter</li>
                <li>✅ Dynamic agent selection and speaking order</li>
                <li>✅ Real-time TTS with synchronized playback</li>
                <li>✅ Multi-round structured discussions</li>
                <li>✅ Agent-specific voice mapping</li>
                <li>✅ Interactive direct questioning</li>
                <li>✅ Conversation synthesis and summary</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
