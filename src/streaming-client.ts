// OpenAIStreamingWebClient for Salesforce API with SSE support
import { EventEmitter } from 'events';
import { ModelMessage, RequestBody, EventResponse, DoneResponse } from './streaming-request';

import { ModelConfiguration } from './model-configs';
import { OpenAI } from 'openai';
import { Stream } from 'openai/streaming';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Export alias for compatibility
export type StreamingMessage = ModelMessage;

// Type guard to check if chunk is EventResponse
function isEventResponse(chunk: unknown): chunk is EventResponse {
  return (
    typeof chunk === 'object' &&
    chunk !== null &&
    'event' in chunk &&
    'data' in chunk &&
    (chunk as any).event === 'generation' &&
    typeof (chunk as any).data === 'object' &&
    'generation_details' in (chunk as any).data
  );
}

function isDoneResponse(chunk: unknown): chunk is DoneResponse {
  return ( typeof chunk === 'object' && chunk !== null && 'event' in chunk && 'data' in chunk && (chunk as any).event === 'generation' && (chunk as any).data === 'DONE');
}





export class OpenAIStreamingWebClient extends EventEmitter {
  private baseUrl: string;
  private apiKey: string;
  private tenantId: string;
  private featureId: string;
  private openai: OpenAI;
  private parameters: Record<string, any>;

  constructor(config: {
    baseUrl?: string;
    apiKey: string;
    tenantId: string;
    featureId?: string;
    llmProvider?: string;
    parameters?: Record<string, any>;
  }) {
    super();
    this.baseUrl = config.baseUrl || 'https://test.api.salesforce.com';
    this.apiKey = config.apiKey;
    this.tenantId = config.tenantId;
    this.featureId = config.featureId || 'EinsteinForDevelopers';
    this.parameters = config.parameters || {};
    
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: '',
      defaultHeaders: {
        'Authorization': `API_KEY ${this.apiKey}`,
        'X-Client-Feature-Id': this.featureId,
        'X-Sfdc-Core-Tenant-Id': this.tenantId,
        ...(config.llmProvider ? { 'X-LLM-Provider': config.llmProvider } : {})
      }
    });
  }


  /**
   * Create streaming request to Salesforce API
   */
  async post(request: RequestBody): Promise<Stream<unknown>> {
    const url = `${this.baseUrl}/chat/generations/stream`;
    

    const body = {
      model: request.model,
      generation_settings: request.generation_settings || {
        max_tokens: request.max_tokens || 2048,
        parameters: {}
      },
      messages: request.messages,
      max_tokens: request.max_tokens || 2048,
      stream: true
    };

    return this.openai.post<RequestBody, Stream<unknown>>(url, {
      stream: true,
      body
    });
  }

  /**
   * Process streaming response and emit events
   */
  // async processStream(stream: ReadableStream<Uint8Array>): Promise<void> {
  //   const reader = stream.getReader();
  //   const decoder = new TextDecoder();
  //   let buffer = '';

  //   try {
  //     while (true) {
  //       const { done, value } = await reader.read();
        
  //       if (done) {
  //         this.emit('end');
  //         break;
  //       }

  //       // Decode the chunk and add to buffer
  //       buffer += decoder.decode(value, { stream: true });
        
  //       // Process complete SSE events
  //       const lines = buffer.split('\n');
  //       buffer = lines.pop() || ''; // Keep incomplete line in buffer

  //       for (const line of lines) {
  //         if (line.trim() === '') continue;
          
  //         const chunk = this.parseSSEData(line);
  //         if (chunk) {
  //           this.emit('chunk', chunk);
            
  //           // Extract content from generations if available
  //           if (chunk.data.generation_details?.generations) {
  //             for (const generation of chunk.data.generation_details.generations) {
  //               if (generation.text) {
  //                 this.emit('content', generation.text);
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     this.emit('error', error);
  //   } finally {
  //     reader.releaseLock();
  //   }
  // }

  /**
   * High-level method to stream chat completion
   */
  async chat(messages: ModelMessage[], options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    onContent?: (content: string) => void;
    onChunk?: (chunk: EventResponse) => void;
    onError?: (error: Error) => void;
    onEnd?: () => void;
  } = {}): Promise<void> {
    const {
      model = 'llmgateway__OpenAIGPT5',
      maxTokens = 2048,
      temperature,
      onContent,
      onChunk,
      onError,
      onEnd
    } = options;

    // Set up event listeners
    if (onContent) this.on('content', onContent);
    if (onChunk) this.on('chunk', onChunk);
    if (onError) this.on('error', onError);
    if (onEnd) this.on('end', onEnd);

    try {
      const request: RequestBody = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        generation_settings: {
          max_tokens: maxTokens,
          parameters: this.parameters
        }
      };

      const stream = await this.post(request);

    

      for await (const chunk of stream) { 
        this.processGeneration(chunk);
      }
      this.emit('end');
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Process a generation chunk from the stream
   */
  private processGeneration(chunk: unknown): void {
    // Check if chunk is EventResponse

    this.emit('chunk', chunk);
    if (isEventResponse(chunk)) {
      // TypeScript now knows chunk is EventResponse
      // console.log('Event:', chunk.event);
      // console.log('ID:', chunk.data.id);
      
      // Process generations
      if (chunk.data.generation_details.generations) {
        for (const generation of chunk.data.generation_details.generations) {
          if (generation.content) {
            this.emit('content', generation.content);
          }
        }
      }
     
      
      
    } else if (isDoneResponse(chunk)) {
      this.emit('end');
    }else {
      console.warn('Received non-EventResponse chunk:', chunk);
    }
  }
}



 

// Utility function to create a simple streaming client
export function createStreamingClient(config: {
  apiKey: string;
  tenantId: string;
  baseUrl?: string;
  featureId?: string;
}): OpenAIStreamingWebClient {
  return new OpenAIStreamingWebClient(config);
}

// Example usage and testing
export async function testStreamingClient() {
  const client = createStreamingClient({
    apiKey: process.env.OPENAI_API_KEY || '',
    tenantId: process.env.OPENAI_TENANT_ID || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://test.api.salesforce.com/einstein/gpt/code/v1.1',
    featureId: process.env.OPENAI_FEATURE_ID || 'EinsteinForDevelopers'
  });

  console.log('🚀 Testing OpenAIStreamingWebClient...\n');

  let fullResponse = '';
  let tokenCount = 0;

  try {
    await client.chat([
      { role: 'user', content: 'Write Fibonacci functions in Typescript' }
    ], {
      model: process.env.OPENAI_MODEL || 'llmgateway__OpenAIGPT5',
      maxTokens: 2048,
      onContent: (content: string) => {
        process.stdout.write(content);
        fullResponse += content;
      },
      onChunk: (chunk: EventResponse) => {
        // Update usage statistics
        tokenCount++;
     
      },
      onError: (error: Error) => {
        console.error('\n❌ Error:', error.message);
      },
      onEnd: () => {
        console.log('\n\n✅ Streaming completed!');
        console.log(`📝 Full response: ${fullResponse}`);
        console.log(`🔢 Content chunks received: ${tokenCount}`);
      }
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in other files
export default OpenAIStreamingWebClient;
