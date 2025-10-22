// OpenAIStreamingWebClient for Salesforce API with SSE support
import { EventEmitter } from 'events';
import { ModelMessage, RequestBody, EventResponse, DoneResponse } from './streaming-request';
import { Response } from './streaming-response';
import { ModelConfiguration, OPENAI_GPT5_CONFIG, QWEN_CONFIG, modelConfigs, EinsteinDevModel } from '../model/model-configs';
import { OpenAI } from 'openai';
import { Stream } from 'openai/streaming';
import * as dotenv from 'dotenv';
import { ModelClient } from './model-client';


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





export class OpenAIStreamingClient extends EventEmitter {
  private baseUrl: string;
  private model: string;
  private openai: OpenAI;
  private parameters: Record<string, any>;

  constructor(config: ModelConfiguration
  ) {
    super();
    this.baseUrl = config.baseUrl || 'https://test.api.salesforce.com/einstein/gpt/code/v1.1';
    this.parameters = config.parameters || {};
    this.model = config.model;
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: '',
      defaultHeaders: {
        'Authorization': `API_KEY ${config.apiKey}`,
        'X-Client-Feature-Id': config.featureId,
        'X-Sfdc-Core-Tenant-Id': config.tenantId,
        ...(config.modelProvider ? { 'X-LLM-Provider': config.modelProvider } : {})
      }
    });
  }


  /**
   * Create streaming request to Salesforce API
   */
  async post(request: RequestBody): Promise<Stream<unknown>> {
    const url = `${this.baseUrl}/chat/generations/stream`;
    return this.openai.post<RequestBody, Stream<unknown>>(url, {
      stream: true,
      body: request
    });
  }

  
  /**
   * High-level method to stream chat completion
   */
  async chat(messages: ModelMessage[], options: {
    maxTokens?: number; // If absent, defaults to 2048
    temperature?: number;
    onContent?: (content: string) => void;
    onChunk?: (chunk: EventResponse) => void;
    onError?: (error: Error) => void;
    onEnd?: () => void;
  } = {}): Promise<void> {
    const {
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
        model: this.model,
        messages,
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
      //console.warn('Received non-EventResponse chunk:', chunk);
    }
  }
}

export class EinsteinDevModelClient extends ModelClient {
  private config: ModelConfiguration;
  constructor(model: EinsteinDevModel) {
    super();
    this.config = modelConfigs[model];
  }
  async chat(systemPrompt: string, userPrompt: string): Promise<Response> {
    const client = new OpenAIStreamingClient(this.config);
    let fullResponse = '';
    let error: Error | null = null;
    try {
      await client.chat([{role: 'system', content: systemPrompt}, {role: 'user', content: userPrompt}],{
        maxTokens: 2048,
        onContent: (content: string) => {
          fullResponse += content;
        },
        onError: (error: Error) => {
          error = error;
        }
      });
    }catch (error) {
      error = error instanceof Error ? error : new Error(String(error));
    }

    if (error != null) {
      return { error: error, response: null };
    } 
    return { error: null, response: fullResponse };
  }
}


 


// Example usage and testing
export async function testStreamingClient(config: ModelConfiguration) {
  const client = new OpenAIStreamingClient(config);

  console.log('🚀 Testing OpenAIStreamingWebClient...\n');
  console.log('🤖 Model: ', config.model);

  let fullResponse = '';
  let tokenCount = 0;

  try {
    await client.chat([
      { role: 'user', content: 'Write Fibonacci functions in Typescript' }
    ], {

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
export default OpenAIStreamingClient;

