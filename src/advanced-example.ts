// Advanced example showing runtime model switching with different API endpoints
import { ModelManager, API_ENDPOINTS, MODEL_CONFIGS } from './config';

class AdvancedModelClient {
  private modelManager: ModelManager;
  private baseClients: Map<string, any> = new Map();

  constructor() {
    this.modelManager = new ModelManager();
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize different API clients
    const config = this.modelManager.getCurrentConfig();
    
    // OpenAI client
    if (process.env.OPENAI_API_KEY) {
      const { OpenAI } = require('openai');
      this.baseClients.set('openai', new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      }));
    }

    // Salesforce client (custom implementation)
    this.baseClients.set('salesforce', {
      async chat(messages: any[], model: string, options: any = {}) {
        const endpoint = API_ENDPOINTS.salesforce;
        const response = await fetch(`${endpoint.baseUrl}/chat/generations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SF_API_KEY}`,
            ...endpoint.headers
          },
          body: JSON.stringify({
            messages,
            model,
            generation_settings: {
              max_tokens: options.maxTokens || 1000,
              parameters: options.parameters || {}
            }
          })
        });
        return response.json();
      }
    });

    // Anthropic client
    if (process.env.ANTHROPIC_API_KEY) {
      const { Anthropic } = require('@anthropic-ai/sdk');
      this.baseClients.set('anthropic', new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      }));
    }
  }

  // Universal chat method that works with any model
  async chat(messages: Array<{role: string, content: string}>, options: any = {}) {
    const config = this.modelManager.getCurrentConfig();
    const client = this.baseClients.get(config.endpoint.name.toLowerCase());
    
    if (!client) {
      throw new Error(`No client available for endpoint: ${config.endpoint.name}`);
    }

    try {
      let response;
      
      switch (config.endpoint.name.toLowerCase()) {
        case 'openai':
          response = await client.chat.completions.create({
            messages,
            model: config.model.id,
            max_tokens: options.maxTokens || config.model.maxTokens,
            ...options
          });
          return {
            content: response.choices[0]?.message?.content,
            usage: response.usage,
            model: response.model
          };

        case 'salesforce':
          response = await client.chat(messages, config.model.id, options);
          return {
            content: response.choices?.[0]?.message?.content,
            usage: response.usage,
            model: response.model
          };

        case 'anthropic':
          response = await client.messages.create({
            model: config.model.id,
            max_tokens: options.maxTokens || config.model.maxTokens,
            messages: messages.map(msg => ({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content
            })),
            ...options
          });
          return {
            content: response.content[0]?.text,
            usage: response.usage,
            model: response.model
          };

        default:
          throw new Error(`Unsupported endpoint: ${config.endpoint.name}`);
      }
    } catch (error) {
      console.error(`Error with ${config.endpoint.name}:`, error);
      throw error;
    }
  }

  // Switch model and automatically handle endpoint switching
  switchModel(modelId: string): boolean {
    return this.modelManager.switchModel(modelId);
  }

  // Get current model info
  getCurrentModel() {
    return this.modelManager.getCurrentConfig().model;
  }

  // Get available models for current endpoint
  getAvailableModels() {
    return this.modelManager.getAvailableModels();
  }

  // Demonstrate different use cases with different models
  async demonstrateUseCases() {
    console.log('=== Advanced Model Switching Demo ===\n');

    const testMessages = [
      { role: 'user', content: 'Explain quantum computing in simple terms' }
    ];

    // Use GPT-4o for general knowledge
    console.log('1. Using GPT-4o for general knowledge:');
    this.switchModel('gpt-4o');
    const response1 = await this.chat(testMessages);
    console.log(`Response: ${response1.content?.substring(0, 100)}...`);
    console.log(`Model: ${response1.model}, Tokens: ${response1.usage?.total_tokens}\n`);

    // Use Claude for detailed analysis
    console.log('2. Using Claude 3.5 Sonnet for detailed analysis:');
    this.switchModel('claude-3-5-sonnet');
    const response2 = await this.chat([
      { role: 'user', content: 'Analyze the pros and cons of different quantum computing approaches' }
    ]);
    console.log(`Response: ${response2.content?.substring(0, 100)}...`);
    console.log(`Model: ${response2.model}, Tokens: ${response2.usage?.total_tokens}\n`);

    // Use Salesforce XGen for Salesforce-specific tasks
    console.log('3. Using Salesforce XGen for Salesforce-specific tasks:');
    this.switchModel('xgen_stream');
    const response3 = await this.chat([
      { role: 'user', content: 'Generate Apex code for a custom Salesforce trigger' }
    ]);
    console.log(`Response: ${response3.content?.substring(0, 100)}...`);
    console.log(`Model: ${response3.model}, Tokens: ${response3.usage?.total_tokens}\n`);

    // Cost comparison
    console.log('4. Cost comparison:');
    const models = ['gpt-4o', 'claude-3-5-sonnet', 'xgen_stream'];
    for (const modelId of models) {
      this.switchModel(modelId);
      const cost = this.modelManager.estimateCost(1000, 500);
      const modelConfig = this.modelManager.getCurrentConfig().model;
      console.log(`${modelConfig.name}: $${cost.toFixed(4)} for 1000+500 tokens`);
    }
  }

  // Dynamic model selection based on task type
  async smartModelSelection(task: string, content: string) {
    console.log(`\n=== Smart Model Selection for: ${task} ===`);

    let selectedModel: string;
    
    // Select model based on task type
    if (task.includes('salesforce') || task.includes('apex') || task.includes('sfdc')) {
      selectedModel = 'xgen_stream';
      console.log('Selected XGen (Salesforce-specific model)');
    } else if (task.includes('analysis') || task.includes('detailed') || task.includes('complex')) {
      selectedModel = 'claude-3-5-sonnet';
      console.log('Selected Claude (best for analysis)');
    } else if (task.includes('vision') || task.includes('image')) {
      selectedModel = 'gpt-4o';
      console.log('Selected GPT-4o (vision capable)');
    } else {
      selectedModel = 'gpt-3.5-turbo';
      console.log('Selected GPT-3.5 Turbo (cost-effective)');
    }

    this.switchModel(selectedModel);
    const response = await this.chat([{ role: 'user', content }]);
    
    console.log(`Response: ${response.content?.substring(0, 150)}...`);
    console.log(`Model used: ${response.model}`);
    
    return response;
  }
}

// Usage example
async function runAdvancedExample() {
  const client = new AdvancedModelClient();
  
  try {
    // Run the demonstration
    await client.demonstrateUseCases();
    
    // Demonstrate smart model selection
    await client.smartModelSelection('salesforce development', 'Create a custom Apex class for data validation');
    await client.smartModelSelection('complex analysis', 'Analyze the impact of AI on software development');
    await client.smartModelSelection('general question', 'What is the weather like today?');
    
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

export { AdvancedModelClient };

// Uncomment to run the demo
// runAdvancedExample();
