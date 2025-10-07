// OpenAIStreamingWebClient using OpenAI SDK's post method
import { OpenAI } from 'openai';
import { EventEmitter } from 'events';

export interface StreamingMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamingRequest {
  model: string;
  messages: StreamingMessage[];
  max_tokens?: number;
  generation_settings?: {
    max_tokens: number;
    parameters: Record<string, any>;
  };
  temperature?: number;
  stream?: boolean;
}

export interface StreamingResponse {
  id: string;
  generation_details: {
    generations: any[];
    cache_control: any;
    parameters: {
      provider: string;
      created: number;
      usage: {
        completion_tokens: number;
        prompt_tokens: number;
        completion_tokens_details: {
          reasoning_tokens: number;
          audio_tokens: number;
          accepted_prediction_tokens: number;
          rejected_prediction_tokens: number;
        };
        prompt_tokens_details: {
          cached_tokens: number;
          audio_tokens: number;
        };
        total_tokens: number;
      };
      model: string;
      system_fingerprint: any;
      obfuscation: string;
      object: string;
    };
  };
  other_details: any;
}

export interface StreamingChunk {
  event: string;
  data: StreamingResponse;
}

export class OpenAIStreamingWebClient extends EventEmitter {
  private openai: OpenAI;
  private baseUrl: string;
  private apiKey: string;
  private tenantId: string;
  private featureId: string;

  constructor(config: {
    baseUrl?: string;
    apiKey: string;
    tenantId: string;
    featureId?: string;
  }) {
    super();
    this.baseUrl = config.baseUrl || 'https://test.api.salesforce.com';
    this.apiKey = config.apiKey;
    this.tenantId = config.tenantId;
    this.featureId = config.featureId || 'EinsteinForDevelopers';

    // Initialize OpenAI client with custom configuration
    this.openai = new OpenAI({
      apiKey: '', // Empty since we're using custom headers
      baseURL: `${this.baseUrl}/einstein/gpt/code/v1.1`,
      defaultHeaders: {
        'Authorization': `API_KEY ${this.apiKey}`,
        'X-Client-Feature-Id': this.featureId,
        'X-Sfdc-Core-Tenant-Id': this.tenantId,
      },
      // Custom fetch to handle Salesforce-specific requirements
      fetch: async (url, requestInit) => {
        const response = await fetch(url, {
          ...requestInit,
          headers: {
            ...requestInit?.headers,
            'Authorization': `API_KEY ${this.apiKey}`,
            'X-Client-Feature-Id': this.featureId,
            'X-Sfdc-Core-Tenant-Id': this.tenantId,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          }
        });
        return response;
      }
    });
  }

  /**
   * Parse SSE data from the stream
   */
  private parseSSEData(data: string): StreamingChunk | null {
    try {
      const lines = data.trim().split('\n');
      let event = '';
      let jsonData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          event = line.substring(7);
        } else if (line.startsWith('data: ')) {
          jsonData = line.substring(6);
        }
      }

      if (event && jsonData) {
        const parsedData = JSON.parse(jsonData);
        return { event, data: parsedData };
      }
    } catch (error) {
      console.error('Error parsing SSE data:', error);
      this.emit('error', error);
    }
    return null;
  }

  /**
   * Create streaming request using OpenAI SDK's post method
   */
  async post(request: StreamingRequest): Promise<ReadableStream<Uint8Array>> {
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

    try {
      // Use OpenAI SDK's post method for streaming
      const response = await this.openai.post('/chat/generations/stream', {
        body: body as any,
        stream: true
      }) as any;

      if (!response.body) {
        throw new Error('No response body received');
      }

      return response.body;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Process streaming response and emit events
   */
  async processStream(stream: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          this.emit('end');
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          const chunk = this.parseSSEData(line);
          if (chunk) {
            this.emit('chunk', chunk);
            
            // Extract content from generations if available
            if (chunk.data.generation_details?.generations) {
              for (const generation of chunk.data.generation_details.generations) {
                if (generation.text) {
                  this.emit('content', generation.text);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      this.emit('error', error);
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * High-level method to stream chat completion using OpenAI SDK
   */
  async chat(messages: StreamingMessage[], options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    onContent?: (content: string) => void;
    onChunk?: (chunk: StreamingChunk) => void;
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
      const request: StreamingRequest = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        generation_settings: {
          max_tokens: maxTokens,
          parameters: {}
        }
      };

      const stream = await this.post(request);
      await this.processStream(stream);
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Alternative method using OpenAI SDK's chat completions
   */
  async chatCompletions(messages: StreamingMessage[], options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    onContent?: (content: string) => void;
    onError?: (error: Error) => void;
    onEnd?: () => void;
  } = {}): Promise<void> {
    const {
      model = 'llmgateway__OpenAIGPT5',
      maxTokens = 2048,
      temperature,
      onContent,
      onError,
      onEnd
    } = options;

    try {
      // Use OpenAI SDK's chat completions with streaming
      const stream = await this.openai.chat.completions.create({
        model,
        messages: messages as any,
        max_tokens: maxTokens,
        temperature,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          this.emit('content', content);
          if (onContent) onContent(content);
        }
      }

      if (onEnd) onEnd();
    } catch (error) {
      this.emit('error', error);
      if (onError) onError(error as Error);
    }
  }

  /**
   * Get usage statistics from the last response
   */
  getLastUsage(): any {
    return this.lastUsage;
  }

  private lastUsage: any = null;

  /**
   * Update usage statistics from chunk
   */
  private updateUsage(chunk: StreamingChunk): void {
    if (chunk.data.generation_details?.parameters?.usage) {
      this.lastUsage = chunk.data.generation_details.parameters.usage;
    }
  }
}

// Utility function to create a simple streaming client
export function createOpenAIStreamingClient(config: {
  apiKey: string;
  tenantId: string;
  baseUrl?: string;
  featureId?: string;
}): OpenAIStreamingWebClient {
  return new OpenAIStreamingWebClient(config);
}

// Example usage and testing
export async function testOpenAIStreamingClient() {
  const client = createOpenAIStreamingClient({
    apiKey: '651192c5-37ff-440a-b930-7444c69f4422',
    tenantId: 'core/falcontest1-core4sdb6/00DSG000002tHLd2AM',
    baseUrl: 'https://test.api.salesforce.com',
    featureId: 'EinsteinForDevelopers'
  });

  console.log('🚀 Testing OpenAIStreamingWebClient with OpenAI SDK...\n');

  let fullResponse = '';
  let tokenCount = 0;

  try {
    console.log('📤 Using OpenAI SDK post method...');
    console.log('📝 Prompt: "Write hello world in Javascript"');
    console.log('🤖 Model: llmgateway__OpenAIGPT5');
    console.log('\n📥 Response:\n');

    await client.chat([
      { role: 'user', content: 'Write hello world in Javascript' }
    ], {
      model: 'llmgateway__OpenAIGPT5',
      maxTokens: 2048,
      onContent: (content: string) => {
        process.stdout.write(content);
        fullResponse += content;
        tokenCount++;
      },
      onChunk: (chunk: StreamingChunk) => {
        // Update usage statistics
        if (chunk.data.generation_details?.parameters?.usage) {
          const usage = chunk.data.generation_details.parameters.usage;
          console.log(`\n📊 Usage: ${usage.total_tokens} tokens (${usage.prompt_tokens} prompt + ${usage.completion_tokens} completion)`);
        }
      },
      onError: (error: Error) => {
        console.error('\n❌ Error:', error.message);
      },
      onEnd: () => {
        console.log('\n\n✅ Streaming completed successfully!');
        console.log(`📊 Total chunks received: ${tokenCount}`);
        console.log(`📝 Response length: ${fullResponse.length} characters`);
        console.log(`🔤 Response preview: ${fullResponse.substring(0, 100)}...`);
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in other files
export default OpenAIStreamingWebClient;
