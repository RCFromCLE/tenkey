// src/lib/services/openrouter.ts
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

interface ModelInfo {
  id: string;
  name: string;
  provider?: string;
  contextLength?: number;
  description?: string;
  costTier?: 'free' | 'low' | 'medium' | 'high';
}

export class OpenRouterService {
  private static instance: OpenRouterService;
  
  static getInstance(): OpenRouterService {
    if (!OpenRouterService.instance) {
      OpenRouterService.instance = new OpenRouterService();
    }
    return OpenRouterService.instance;
  }

  static getClient(apiKey: string): OpenAI {
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }
    return new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://tenkey.ai',
        'X-Title': 'TenKey AI',
        'Content-Type': 'application/json'
      }
    });
  }

  static async generateResponse(
    messages: Array<ChatCompletionMessageParam>, 
    apiKey: string, 
    model: string
  ): Promise<ReadableStream<string>> {
    const openai = this.getClient(apiKey);
    
    try {
      console.log(`Creating completion with model: ${model}, message count: ${messages.length}`);
      
      // Check if this is a problematic model
      const isXAIModel = model.startsWith('x-ai/');
      
      // For x-ai models, use non-streaming approach as a workaround
      if (isXAIModel) {
        console.log('Using non-streaming approach for x-ai model');
        
        const completion = await openai.chat.completions.create({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 4000,
          top_p: 0.9,
          stream: false
        });
        
        const content = completion.choices[0]?.message?.content || '';
        console.log(`Non-streaming response received, length: ${content.length}`);
        
        // Simulate realistic streaming for non-streaming models
        return new ReadableStream<string>({
          start(controller) {
            let index = 0;
            const words = content.split(' ');
            
            const streamWords = () => {
              if (index >= words.length) {
                controller.close();
                return;
              }
              
              // Send 1-3 words at a time for more realistic streaming
              const wordsToSend = Math.min(Math.random() > 0.7 ? 3 : Math.random() > 0.4 ? 2 : 1, words.length - index);
              const chunk = words.slice(index, index + wordsToSend).join(' ') + (index + wordsToSend < words.length ? ' ' : '');
              
              controller.enqueue(chunk);
              index += wordsToSend;
              
              // Realistic delay between chunks (20-80ms)
              setTimeout(streamWords, Math.random() * 60 + 20);
            };
            
            streamWords();
          }
        });
      }
      
      // For other models, use optimized streaming
      const requestParams: any = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 1.0,
        presence_penalty: 0.6,
        stream: true
      };
      
      const stream = await openai.chat.completions.create(requestParams);

      console.log('OpenRouter API call successful, creating optimized stream');

      return new ReadableStream<string>({
        async start(controller) {
          try {
            let buffer = '';
            let chunkCount = 0;
            let lastFlushTime = Date.now();
            
            // The stream is an AsyncIterable
            for await (const chunk of stream as any) {
              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                chunkCount++;
                buffer += content;
                
                const now = Date.now();
                const timeSinceLastFlush = now - lastFlushTime;
                
                // Flush buffer more frequently for faster streaming
                // Either when we have enough content or enough time has passed
                if (buffer.length >= 10 || timeSinceLastFlush >= 50 || content.includes(' ')) {
                  controller.enqueue(buffer);
                  buffer = '';
                  lastFlushTime = now;
                  
                  if (chunkCount <= 5) {
                    console.log(`Fast stream chunk ${chunkCount} flushed`);
                  }
                }
              }
            }
            
            // Flush any remaining content
            if (buffer) {
              controller.enqueue(buffer);
            }
            
            console.log(`Optimized stream completed. Total chunks: ${chunkCount}`);
            controller.close();
          } catch (error) {
            console.error('Error in OpenRouter stream:', error);
            controller.error(error);
          }
        }
      });
    } catch (error: any) {
      console.error('OpenRouter API error:', error);
      
      // Return error as a simple stream with proper formatting
      return new ReadableStream<string>({
        start(controller) {
          const errorMessage = 'I encountered an error analyzing the filing. Please try a more specific question or consider switching to a different model using the model selector.';
          // Send the error message as a properly formatted string
          controller.enqueue(errorMessage);
          controller.close();
        }
      });
    }
  }

  static async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      const data = await response.json();
      
      // Transform OpenRouter models to our ModelInfo format
      return data.data.map((model: any) => {
        // Extract provider from model ID (e.g., "openai/gpt-4" -> "OpenAI")
        const provider = model.id.split('/')[0];
        const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
        
        // Determine cost tier based on pricing
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
          costTier
        };
      });
    } catch (error) {
      console.error('Failed to fetch models:', error);
      // Return default models if API fails
      return [
        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', contextLength: 128000, costTier: 'high' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', contextLength: 128000, costTier: 'low' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', contextLength: 200000, costTier: 'medium' },
        { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google', contextLength: 2000000, costTier: 'medium' },
        { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta', contextLength: 131072, costTier: 'low' },
      ];
    }
  }

  /**
   * Create a chat completion (non-streaming)
   */
  async createChatCompletion(
    messages: ChatCompletionMessageParam[],
    model: string,
    apiKey: string
  ): Promise<string> {
    const openai = OpenRouterService.getClient(apiKey);
    
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 1.0,
        presence_penalty: 0.6,
        stream: false
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Chat completion error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * Stream a chat completion
   */
  async *streamChatCompletion(
    messages: ChatCompletionMessageParam[],
    model: string,
    apiKey: string
  ): AsyncGenerator<OpenAI.Chat.ChatCompletionChunk, void, unknown> {
    const openai = OpenRouterService.getClient(apiKey);
    
    try {
      const stream = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 1.0,
        presence_penalty: 0.6,
        stream: true
      });

      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error: any) {
      console.error('Stream completion error:', error);
      throw new Error(`Failed to stream response: ${error.message}`);
    }
  }
}
