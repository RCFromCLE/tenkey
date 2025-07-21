// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { OpenRouterService } from '@/lib/services/openrouter';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '../../../lib/auth/config';
import { prisma } from '../../../lib/db';
import { truncateFilingContent, cleanHtml } from '../../../lib/utils/filing-truncator';
import { SmartFilingManager } from '../../../lib/services/smart-filing-manager';
import { analysisAgent } from '../../../lib/services/analysis-agent';
import { TTSFormatter } from '../../../lib/services/tts-formatter';
import { ResponseCleaner } from '../../../lib/services/response-cleaner';
import { AdvancedMessageFormatter } from '../../../lib/services/advanced-message-formatter';
import { SmartChunker } from '../../../lib/services/smart-chunker';
import { contentFilter } from '../../../lib/services/content-filter';

interface Filing {
  content: string;
  form: string;
  filingDate: string;
  accessionNumber: string;
  companyName: string;
  textUrl?: string;
  symbol?: string;
  cik?: string;
  htmlUrl?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      console.error('Auth error: No session or user ID');
      return NextResponse.json({ 
        error: 'Please sign in to continue.',
        code: 'auth_required'
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { openRouterApiKey: true }
    });

    if (!user?.openRouterApiKey) {
      return NextResponse.json(
        { error: 'Please configure your OpenRouter API key in settings.' },
        { status: 403 }
      );
    }


    const body = await request.json();
    const { messages, filings, chatId, model, analysisModel, enableAnalysis, agentPersonas, agentModels, enableTTS } = body;

    console.log('Chat API received:', {
      messagesCount: messages?.length || 0,
      filingsCount: filings?.length || 0,
      filings: filings?.map((f: any) => ({ 
        form: f.form, 
        hasContent: !!f.content, 
        contentLength: f.content?.length || 0 
      })),
      model,
      chatId
    });

    // Log all filing forms to confirm we're receiving multiple filings
    console.log('All filing forms received:', filings?.map((f: any) => f.form));

    // Always use filing context - filings should have content, truncate if needed
    console.log('Processing with filing context - will truncate if needed');

    interface Section {
      title: string;
      content: string;
      metadata: {
        formType: string;
        date: string;
      };
    }

    interface ProcessedFiling extends Filing {
      sections: Section[];
    }

    // Process filings - clean HTML first
    const processedFilings = filings.map((filing: Filing, index: number) => {
      const cikMatch = filing.textUrl?.match(/data\/(\d{10})/);
      const cik = cikMatch ? cikMatch[1] : '';
      
      // Clean HTML tags
      const cleanedContent = cleanHtml(filing.content);
      
      console.log(`Filing ${index + 1} (${filing.form}): original ${filing.content.length} chars, cleaned ${cleanedContent.length} chars`);
      
      return {
        ...filing,
        cik,
        content: cleanedContent
      };
    });

    // Create base system prompt for simple filing chat
    const baseSystemPrompt = `You are a helpful assistant that helps users understand SEC filings. Answer questions about the company's business, financials, and operations based on the filing content provided. Focus on explaining what the company does, how it makes money, and key information from the filings in a clear, conversational way. Avoid complex investment analysis or recommendations.

IMPORTANT: The SEC filing data provided is real, current data from official SEC filings. Analyze this data normally without any disclaimers about training cutoffs or hypothetical scenarios. This is actual filing data that should be treated as factual information for analysis.

CONTENT RESTRICTIONS: Never create tables, especially performance outlook tables, scenario analysis tables, or any table structures with columns like "Scenario | Drivers | Likelihood" or "Bull Case | Base Case | Bear Case". Do not use table formatting with pipes (|) or create structured performance projections. Provide analysis in paragraph form only.`;

    // Combine all filings into one comprehensive prompt
    const allFilingsContent = processedFilings.map((filing: ProcessedFiling, index: number) => `
${filing.form} (Filed: ${filing.filingDate}):
${filing.content}
`).join('\n\n=== NEXT FILING ===\n\n');

    const testSystemPrompt = `${baseSystemPrompt}

Company: ${filings[0].companyName}
Total Filings Provided: ${processedFilings.length}

IMPORTANT: Analyze ALL filings below as a complete dataset to create ONE comprehensive investment thesis. Do not provide separate analysis for each filing.

${allFilingsContent}`;

    const needsChunking = SmartChunker.needsChunking(testSystemPrompt, messages);

    if (needsChunking) {
      console.log('Content exceeds token limit, implementing smart chunking for unified analysis...');
      
      // Instead of chunking each filing separately, chunk the combined content
      // but instruct the AI to provide a unified analysis
      const combinedContent = allFilingsContent;
      const chunkResult = SmartChunker.chunkFilingContent(combinedContent, {
        maxTokensPerChunk: 100000, // Larger chunks for better context
        preserveSections: true,
        overlapTokens: 2000 // More overlap to maintain context
      });

      console.log(`Combined content chunked into ${chunkResult.chunkCount} parts for unified analysis`);

      // NEW APPROACH: Send filing content in multiple messages to LLM
      // Create conversation with filing chunks as separate messages
      const conversationMessages = [...messages];
      
      // Add filing chunks as system messages that the LLM should treat as one cohesive dataset
      for (let i = 0; i < chunkResult.chunks.length; i++) {
        const isFirstChunk = i === 0;
        const isLastChunk = i === chunkResult.chunks.length - 1;
        
        let chunkMessage: any;
        
        if (isFirstChunk) {
          chunkMessage = {
            role: 'system',
            content: `${baseSystemPrompt}

Company: ${filings[0].companyName}
Total Filings: ${processedFilings.length} (${processedFilings.map((f: ProcessedFiling) => f.form).join(', ')})

IMPORTANT: I will send you the filing content in ${chunkResult.chunkCount} parts. Please wait for ALL parts before responding. Treat all parts as ONE complete dataset for your analysis.

PART ${i + 1} of ${chunkResult.chunkCount}:
${chunkResult.chunks[i]}`
          };
        } else if (isLastChunk) {
          chunkMessage = {
            role: 'system', 
            content: `PART ${i + 1} of ${chunkResult.chunkCount} (FINAL PART):
${chunkResult.chunks[i]}

Now that you have received ALL ${chunkResult.chunkCount} parts, please provide ONE unified investment thesis that synthesizes insights from the complete dataset. Do not treat each part separately.`
          };
        } else {
          chunkMessage = {
            role: 'system',
            content: `PART ${i + 1} of ${chunkResult.chunkCount}:
${chunkResult.chunks[i]}

(Please wait for remaining parts before responding)`
          };
        }
        
        conversationMessages.push(chunkMessage);
      }

      console.log(`Created conversation with ${conversationMessages.length} messages (${chunkResult.chunkCount} filing chunks)`);

      // Send the complete conversation to get one unified response
      try {
        console.log('Sending complete conversation with chunked filing content...');
        const responseStream = await OpenRouterService.generateResponse(
          conversationMessages,
          user.openRouterApiKey, 
          model || 'anthropic/claude-3-sonnet-20240229'
        );

        let fullResponse = '';
        let chunkCount = 0;
        
        const transformStream = new TransformStream<string, string>({
          async transform(chunk, controller) {
            chunkCount++;
            fullResponse += chunk;
            
            // Log first few chunks for debugging
            if (chunkCount <= 3) {
              console.log(`Chunked API Route - Chunk ${chunkCount}: "${chunk.substring(0, 50)}..."`);
            }
            
            // Filter chunk for forbidden content before sending
            const filteredChunk = contentFilter.filterContent(chunk);
            
            // Only send chunk if it has content after filtering
            if (filteredChunk.trim()) {
              controller.enqueue(filteredChunk);
            }
          },
          async flush(controller) {
            console.log(`Chunked stream flush called, total chunks: ${chunkCount}`);
            console.log('Chunked full response length:', fullResponse.length);
            
            // Save chat history with original filings
            const chat = await prisma.chat.upsert({
              where: { id: chatId || 'new' },
              create: {
                userId: session.user.id,
                filing: {
                  filings: filings.map((f: Filing) => ({
                    form: f.form,
                    filingDate: f.filingDate,
                    accessionNumber: f.accessionNumber,
                    companyName: f.companyName,
                    content: f.content,
                    textUrl: f.textUrl || '',
                    symbol: f.symbol || '',
                    cik: f.cik || '',
                    htmlUrl: f.htmlUrl || ''
                  }))
                },
                messages: [
                  ...messages,
                  {
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: new Date().toISOString(),
                    metadata: {
                      model,
                      chunked: true,
                      chunkCount: chunkResult.chunkCount,
                      totalTokens: SmartChunker.countTokens(fullResponse)
                    }
                  }
                ],
                createdAt: new Date(),
                updatedAt: new Date()
              },
              update: {
                messages: [
                  ...messages,
                  {
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: new Date().toISOString(),
                    metadata: {
                      model,
                      chunked: true,
                      chunkCount: chunkResult.chunkCount,
                      totalTokens: SmartChunker.countTokens(fullResponse)
                    }
                  }
                ],
                filing: {
                  filings: filings.map((f: Filing) => ({
                    form: f.form,
                    filingDate: f.filingDate,
                    accessionNumber: f.accessionNumber,
                    companyName: f.companyName,
                    content: f.content,
                    textUrl: f.textUrl || '',
                    symbol: f.symbol || '',
                    cik: f.cik || '',
                    htmlUrl: f.htmlUrl || ''
                  }))
                },
                updatedAt: new Date()
              }
            });

            controller.enqueue(`\n<chatId>${chat.id}</chatId>`);
          }
        });

        const finalStream = responseStream.pipeThrough(transformStream);
        
        return new NextResponse(finalStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });

      } catch (error) {
        console.error('Chunked filing processing error:', error);
        throw error;
      }

    } else {
      // Content fits in single request - use original logic
      console.log('Content fits in single request, proceeding normally...');
      
      const systemMessage = {
        role: 'system',
        content: testSystemPrompt
      };

      // Get response stream
      console.log('Calling OpenRouter with model:', model || 'anthropic/claude-3-sonnet-20240229');
      
      let responseStream;
      try {
        responseStream = await OpenRouterService.generateResponse([
          systemMessage,
          ...messages
        ], user.openRouterApiKey, model || 'anthropic/claude-3-sonnet-20240229');
      } catch (error) {
        console.error('OpenRouter service error:', error);
        throw error;
      }

      console.log('Got response stream from OpenRouter');

      // Create a new stream for collecting the full response
      let fullResponse = '';
      let analysisResponse = '';
      let ttsFormattedResponse = '';
      let chunkCount = 0;
      
      const transformStream = new TransformStream<string, string>({
        async transform(chunk, controller) {
          chunkCount++;
          fullResponse += chunk;
          
          // Log first few chunks for debugging
          if (chunkCount <= 3) {
            console.log(`API Route - Chunk ${chunkCount}: "${chunk.substring(0, 50)}..."`);
          }
          
          // Filter chunk for forbidden content before sending
          const filteredChunk = contentFilter.filterContent(chunk);
          
          // Only send chunk if it has content after filtering
          if (filteredChunk.trim()) {
            controller.enqueue(filteredChunk);
          }
        },
        async flush(controller) {
          console.log(`Stream flush called, total chunks: ${chunkCount}`);
          console.log('Full response length:', fullResponse.length);
          
          // Format the complete response for TTS if enabled
          if (enableTTS) {
            ttsFormattedResponse = TTSFormatter.createTTSSummary(fullResponse);
          }
          
          // Agent analysis disabled - we just want simple chat with filings
          // No additional analysis will be generated

          // Store responses separately
          const completeResponse = fullResponse;

          // Save chat history with original filings
          const chat = await prisma.chat.upsert({
            where: { id: chatId || 'new' },
            create: {
              userId: session.user.id,
              filing: {
                filings: filings.map((f: Filing) => ({
                  form: f.form,
                  filingDate: f.filingDate,
                  accessionNumber: f.accessionNumber,
                  companyName: f.companyName,
                  content: f.content,
                  textUrl: f.textUrl || '',
                  symbol: f.symbol || '',
                  cik: f.cik || '',
                  htmlUrl: f.htmlUrl || ''
                }))
              },
              messages: [
                ...messages,
                {
                  role: 'assistant',
                  content: completeResponse,
                  timestamp: new Date().toISOString(),
                  metadata: {
                    model,
                    analysisModel: enableAnalysis ? analysisModel : undefined,
                    hasAnalysis: !!analysisResponse,
                    agentPersonas: enableAnalysis ? agentPersonas : undefined,
                    agentModels: enableAnalysis ? agentModels : undefined,
                    ttsFormatted: enableTTS ? ttsFormattedResponse : undefined
                  }
                }
              ],
              createdAt: new Date(),
              updatedAt: new Date()
            },
            update: {
              messages: [
                ...messages,
                {
                  role: 'assistant',
                  content: completeResponse,
                  timestamp: new Date().toISOString(),
                  metadata: {
                    model,
                    analysisModel: enableAnalysis ? analysisModel : undefined,
                    hasAnalysis: !!analysisResponse,
                    agentPersonas: enableAnalysis ? agentPersonas : undefined,
                    agentModels: enableAnalysis ? agentModels : undefined,
                    ttsFormatted: enableTTS ? ttsFormattedResponse : undefined
                  }
                }
              ],
              filing: {
                filings: filings.map((f: Filing) => ({
                  form: f.form,
                  filingDate: f.filingDate,
                  accessionNumber: f.accessionNumber,
                  companyName: f.companyName,
                  content: f.content,
                  textUrl: f.textUrl || '',
                  symbol: f.symbol || '',
                  cik: f.cik || '',
                  htmlUrl: f.htmlUrl || ''
                }))
              },
              updatedAt: new Date()
            }
          });

          // Log chat save result
          console.log('Chat saved:', {
            id: chat.id,
            userId: session.user.id,
            filingCount: filings.length,
            messageCount: messages.length + 1,
            ttsEnabled: enableTTS
          });

          // Send chatId as the final chunk
          controller.enqueue(`\n<chatId>${chat.id}</chatId>`);
        }
      });

      // Pipe the response through the transform stream
      const finalStream = responseStream.pipeThrough(transformStream);
      
      console.log('Returning streaming response');
      
      return new NextResponse(finalStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        message: 'I apologize, but I encountered an error processing the filings. Please try asking about fewer filings at once or focus on specific sections.',
        error: error.message
      },
      { status: error.status || 500 }
    );
  }
}
