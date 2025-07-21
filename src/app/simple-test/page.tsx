'use client';

import React, { useState } from 'react';
import { EnhancedAgentConversation } from '@/components/filing/EnhancedAgentConversation';

export default function SimpleTestPage() {
  const [selectedModel, setSelectedModel] = useState('openrouter/anthropic/claude-3.5-sonnet');
  const [apiKey, setApiKey] = useState('test-key');

  const agentModels = {
    bull: 'openrouter/anthropic/claude-3.5-sonnet',
    bear: 'openrouter/meta-llama/llama-3.1-70b-instruct',
    balanced: 'openrouter/openai/gpt-4o',
  };

  const mockFilings = [
    { id: '1', type: '10-K', date: '2024-03-15', title: 'Annual Report', content: '...' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-red-500 mb-8">SIMPLE TEST PAGE</h1>
      <EnhancedAgentConversation
        symbol="TEST"
        companyName="Test Company"
        filings={mockFilings}
        selectedModel={selectedModel}
        agentModels={agentModels}
        apiKey={apiKey}
      />
    </div>
  );
}
