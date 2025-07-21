// src/lib/services/openai.ts
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

export class OpenAIService {
  private static instance: OpenAIService;
  
  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
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

  private static async createCompletion(
    openai: OpenAI,
    messages: Array<ChatCompletionMessageParam>,
    model: string,
    retryCount = 0
  ): Promise<ReadableStream<string>> {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 1.0,
        presence_penalty: 0.6,
        stream: true,
        transforms: ["middle-out"]
      } as any); // Type assertion needed for custom OpenRouter params

      // Convert the stream of chunks into a more efficient stream
      const textStream = new ReadableStream({
        async start(controller) {
          try {
            const stream = response as unknown as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
            let lastContent = '';
            
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(content);
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return textStream;
    } catch (error: any) {
      // Check for OpenRouter error response format
      if (error.response?.error) {
        console.error('OpenRouter error:', error.response.error);
        const errorCode = error.response.error.code;
        const errorMessage = error.response.error.message;

        // Retry on server errors (500, 502) or token limit errors
        const shouldRetry = (
          (errorCode === 500 || errorCode === 502) || // Server errors
          (errorCode === 400 && errorMessage.includes('maximum context length')) // Token limit
        );

        if (shouldRetry && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Retrying with ${model} (attempt ${retryCount + 1}) after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.createCompletion(openai, messages, model, retryCount + 1);
        }
      }

      // If we get here, all retries and fallbacks failed
      throw new Error(`OpenRouter error: ${error.response?.error?.message || error.message}`);
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
    const openai = OpenAIService.getClient(apiKey);
    
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
    const openai = OpenAIService.getClient(apiKey);
    
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

  static async generateResponse(messages: Array<ChatCompletionMessageParam>, apiKey: string, model: string): Promise<ReadableStream<string>> {
    try {
      const openai = this.getClient(apiKey);
      return await this.createCompletion(openai, messages, model);
    } catch (error: any) {
      console.error('Final error:', error);
      
      // Create an error stream
      return new ReadableStream({
        start(controller) {
          const errorMessage = error.status === 429 || (error.response?.error?.code === 502)
            ? 'I apologize, but the service is experiencing high load at the moment. Please try again shortly.'
            : 'I encountered an error analyzing the filing. Please try a more specific question or consider switching to a different model using the model selector.';
          
          // Stream the error message character by character
          for (const char of errorMessage) {
            controller.enqueue(char);
          }
          controller.close();
        }
      });
    }
  }
}
