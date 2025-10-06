// Comprehensive example of OpenAIStreamingWebClient usage
import { OpenAIStreamingWebClient, createStreamingClient, StreamingMessage } from './streaming-client';

// Enhanced streaming client with retry logic and better error handling
export class EnhancedStreamingClient extends OpenAIStreamingWebClient {
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: {
    baseUrl?: string;
    apiKey: string;
    tenantId: string;
    featureId?: string;
    maxRetries?: number;
    retryDelay?: number;
  }) {
    super(config);
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Enhanced chat method with retry logic
   */
  async chatWithRetry(messages: StreamingMessage[], options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    onContent?: (content: string) => void;
    onChunk?: (chunk: any) => void;
    onError?: (error: Error) => void;
    onEnd?: () => void;
  } = {}): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries}`);
        
        await this.chat(messages, {
          ...options,
          onError: (error: Error) => {
            lastError = error;
            console.error(`❌ Attempt ${attempt} failed:`, error.message);
          }
        });
        
        // If we get here, the request was successful
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ Retrying in ${this.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          this.retryDelay *= 2; // Exponential backoff
        }
      }
    }

    throw new Error(`Failed after ${this.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Stream with progress tracking
   */
  async streamWithProgress(messages: StreamingMessage[], options: {
    model?: string;
    maxTokens?: number;
    onProgress?: (progress: { received: number; total?: number }) => void;
  } = {}): Promise<string> {
    let fullResponse = '';
    let chunkCount = 0;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      this.chat(messages, {
        ...options,
        onContent: (content: string) => {
          fullResponse += content;
          chunkCount++;
          
          if (options.onProgress) {
            options.onProgress({
              received: chunkCount,
              total: undefined // Salesforce doesn't provide total in advance
            });
          }
        },
        onChunk: (chunk: any) => {
          // Log chunk details for debugging
          console.log(`📦 Chunk ${chunkCount + 1}:`, {
            event: chunk.event,
            model: chunk.data.generation_details?.parameters?.model,
            usage: chunk.data.generation_details?.parameters?.usage
          });
        },
        onError: (error: Error) => {
          reject(error);
        },
        onEnd: () => {
          const duration = Date.now() - startTime;
          console.log(`\n✅ Streaming completed in ${duration}ms`);
          console.log(`📊 Total chunks: ${chunkCount}`);
          console.log(`📝 Response length: ${fullResponse.length} characters`);
          resolve(fullResponse);
        }
      });
    });
  }
}

// Example usage scenarios
export async function demonstrateStreamingClient() {
  console.log('🚀 OpenAIStreamingWebClient Demonstration\n');

  // Create enhanced client
  const client = new EnhancedStreamingClient({
    apiKey: '651192c5-37ff-440a-b930-7444c69f4422',
    tenantId: 'core/falcontest1-core4sdb6/00DSG000002tHLd2AM',
    baseUrl: 'https://test.api.salesforce.com',
    featureId: 'EinsteinForDevelopers',
    maxRetries: 3,
    retryDelay: 1000
  });

  // Example 1: Basic streaming
  console.log('=== Example 1: Basic Streaming ===');
  try {
    await client.chat([
      { role: 'user', content: 'Write hello world in Javascript' }
    ], {
      model: 'llmgateway__OpenAIGPT5',
      maxTokens: 2048,
      onContent: (content: string) => {
        process.stdout.write(content);
      },
      onEnd: () => {
        console.log('\n✅ Basic streaming completed\n');
      }
    });
  } catch (error) {
    console.error('❌ Basic streaming failed:', error);
  }

  // Example 2: Streaming with progress tracking
  console.log('=== Example 2: Streaming with Progress ===');
  try {
    const response = await client.streamWithProgress([
      { role: 'user', content: 'Explain the benefits of TypeScript over JavaScript' }
    ], {
      model: 'llmgateway__OpenAIGPT5',
      maxTokens: 1000,
      onProgress: (progress) => {
        process.stdout.write(`\r📊 Progress: ${progress.received} chunks received`);
      }
    });
    
    console.log(`\n📝 Final response: ${response.substring(0, 100)}...`);
  } catch (error) {
    console.error('❌ Progress streaming failed:', error);
  }

  // Example 3: Streaming with retry logic
  console.log('\n=== Example 3: Streaming with Retry Logic ===');
  try {
    await client.chatWithRetry([
      { role: 'user', content: 'Generate a simple React component' }
    ], {
      model: 'llmgateway__OpenAIGPT5',
      maxTokens: 1500,
      onContent: (content: string) => {
        process.stdout.write(content);
      },
      onEnd: () => {
        console.log('\n✅ Retry streaming completed\n');
      }
    });
  } catch (error) {
    console.error('❌ Retry streaming failed:', error);
  }

  // // Example 4: Different models
  // console.log('=== Example 4: Different Models ===');
  // const models = [
  //   'llmgateway__OpenAIGPT5',
  //   'llmgateway__OpenAIGPT4o',
  //   'xgen_stream'
  // ];

  // for (const model of models) {
  //   console.log(`\n🤖 Testing model: ${model}`);
  //   try {
  //     await client.chat([
  //       { role: 'user', content: 'Say hello and tell me your model name' }
  //     ], {
  //       model,
  //       maxTokens: 100,
  //       onContent: (content: string) => {
  //         process.stdout.write(content);
  //       },
  //       onEnd: () => {
  //         console.log(`\n✅ ${model} completed`);
  //       }
  //     });
  //   } catch (error) {
  //     console.error(`❌ ${model} failed:`, error);
  //   }
  // }
}

// Integration with existing model switching framework
export class StreamingModelManager {
  private clients: Map<string, EnhancedStreamingClient> = new Map();

  constructor() {
    // Initialize clients for different environments
    this.initializeClients();
  }

  private initializeClients() {
    // Test environment client
    this.clients.set('test', new EnhancedStreamingClient({
      apiKey: '651192c5-37ff-440a-b930-7444c69f4422',
      tenantId: 'core/falcontest1-core4sdb6/00DSG000002tHLd2AM',
      baseUrl: 'https://test.api.salesforce.com',
      featureId: 'EinsteinForDevelopers'
    }));

    // Production environment client (example)
    this.clients.set('production', new EnhancedStreamingClient({
      apiKey: process.env.SF_API_KEY || '',
      tenantId: process.env.SF_TENANT_ID || '',
      baseUrl: 'https://api.salesforce.com',
      featureId: 'EinsteinForDevelopers'
    }));
  }

  /**
   * Get client for specific environment
   */
  getClient(environment: string = 'test'): EnhancedStreamingClient {
    const client = this.clients.get(environment);
    if (!client) {
      throw new Error(`No client found for environment: ${environment}`);
    }
    return client;
  }

  /**
   * Stream with automatic environment selection
   */
  async stream(messages: StreamingMessage[], options: {
    environment?: string;
    model?: string;
    maxTokens?: number;
    onContent?: (content: string) => void;
  } = {}): Promise<string> {
    const { environment = 'test', ...streamOptions } = options;
    const client = this.getClient(environment);
    
    return client.streamWithProgress(messages, streamOptions);
  }
}

// Usage example for the streaming model manager
export async function demonstrateStreamingModelManager() {
  console.log('🎯 StreamingModelManager Demonstration\n');

  const manager = new StreamingModelManager();

  try {
    // Stream with test environment
    const response = await manager.stream([
      { role: 'user', content: 'Create a simple Node.js server' }
    ], {
      environment: 'test',
      model: 'llmgateway__OpenAIGPT5',
      maxTokens: 1000,
      onContent: (content: string) => {
        process.stdout.write(content);
      }
    });

    console.log(`\n\n📝 Complete response: ${response}`);
  } catch (error) {
    console.error('❌ Streaming model manager failed:', error);
  }
}

// Run demonstrations
demonstrateStreamingClient();
demonstrateStreamingModelManager();


