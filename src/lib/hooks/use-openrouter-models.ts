import { useState, useEffect } from 'react';
import { Model } from '../types/filing-chat';

export function useOpenRouterModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json();
        
        const transformedModels: Model[] = data.data.map((model: any) => {
          const provider = model.id.split('/')[0];
          const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
          
          let costTier: 'free' | 'low' | 'medium' | 'high' = 'medium';
          const pricing = model.pricing;
          if (pricing) {
            const promptPrice = parseFloat(pricing.prompt);
            if (promptPrice === 0) costTier = 'free';
            else if (promptPrice < 0.001) costTier = 'low';
            else if (promptPrice < 0.01) costTier = 'medium';
            else costTier = 'high';
          }
          
          return {
            id: model.id,
            name: model.name || model.id.split('/')[1],
            provider: providerName,
            contextLength: model.context_length,
            description: model.description,
            costTier,
            pricing: model.pricing
          };
        });
        
        // Sort models by provider and then by name
        transformedModels.sort((a, b) => {
          if (a.provider !== b.provider) {
            return (a.provider || '').localeCompare(b.provider || '');
          }
          return a.name.localeCompare(b.name);
        });
        
        setModels(transformedModels);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch OpenRouter models:', err);
        setError('Failed to fetch models');
        
        // Fallback to default models if fetch fails
        setModels([
          { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', provider: 'Google', costTier: 'free' },
          { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', costTier: 'high' },
          { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', costTier: 'low' },
          { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', costTier: 'high' },
          { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', costTier: 'low' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchModels();
  }, []);

  return { models, loading, error };
}
