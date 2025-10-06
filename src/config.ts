// Configuration management for different API endpoints and models

export interface ApiEndpoint {
  name: string;
  baseUrl: string;
  authType: 'api_key' | 'bearer' | 'oauth';
  headers: Record<string, string>;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costPerToken?: number;
  capabilities: string[];
}

// API Endpoint configurations
export const API_ENDPOINTS: Record<string, ApiEndpoint> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    authType: 'api_key',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  salesforce: {
    name: 'Salesforce Einstein',
    baseUrl: 'https://api.salesforce.com/einstein/gpt/code/v1.1',
    authType: 'bearer',
    headers: {
      'Content-Type': 'application/json',
      'x-client-feature-id': 'EinsteinGptForDevelopers'
    }
  },
  anthropic: {
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    authType: 'api_key',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }
  }
};

// Model configurations
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // OpenAI Models
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    maxTokens: 4096,
    costPerToken: 0.0005,
    capabilities: ['chat', 'completion', 'function-calling']
  },
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    maxTokens: 8192,
    costPerToken: 0.03,
    capabilities: ['chat', 'completion', 'function-calling', 'vision']
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    maxTokens: 128000,
    costPerToken: 0.005,
    capabilities: ['chat', 'completion', 'function-calling', 'vision', 'multimodal']
  },

  // Salesforce Models
  'xgen_stream': {
    id: 'xgen_stream',
    name: 'XGen Stream',
    provider: 'salesforce',
    maxTokens: 8192,
    capabilities: ['chat', 'completion', 'salesforce-specific']
  },
  'sf_gpt4o': {
    id: 'llmgateway__OpenAIGPT4o',
    name: 'GPT-4o (via Salesforce)',
    provider: 'salesforce',
    maxTokens: 128000,
    capabilities: ['chat', 'completion', 'function-calling']
  },
  'sf_claude': {
    id: 'llmgateway__BedrockAnthropicClaude37Sonnet',
    name: 'Claude 3.7 Sonnet (via Salesforce)',
    provider: 'salesforce',
    maxTokens: 200000,
    capabilities: ['chat', 'completion', 'large-context']
  },

  // Anthropic Models
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    maxTokens: 200000,
    costPerToken: 0.003,
    capabilities: ['chat', 'completion', 'large-context', 'vision']
  }
};

// Runtime configuration class
export class ModelManager {
  private currentEndpoint: string;
  private currentModel: string;
  private apiKeys: Record<string, string>;

  constructor() {
    this.currentEndpoint = process.env.DEFAULT_ENDPOINT || 'openai';
    this.currentModel = process.env.DEFAULT_MODEL || 'gpt-3.5-turbo';
    this.apiKeys = {
      openai: process.env.OPENAI_API_KEY || '',
      salesforce: process.env.SF_API_KEY || '',
      anthropic: process.env.ANTHROPIC_API_KEY || ''
    };
  }

  // Switch API endpoint at runtime
  switchEndpoint(endpointName: string): boolean {
    if (API_ENDPOINTS[endpointName]) {
      this.currentEndpoint = endpointName;
      console.log(`Switched to endpoint: ${API_ENDPOINTS[endpointName].name}`);
      return true;
    } else {
      console.warn(`Endpoint ${endpointName} not found. Available:`, Object.keys(API_ENDPOINTS));
      return false;
    }
  }

  // Switch model at runtime
  switchModel(modelId: string): boolean {
    if (MODEL_CONFIGS[modelId]) {
      this.currentModel = modelId;
      const modelConfig = MODEL_CONFIGS[modelId];
      console.log(`Switched to model: ${modelConfig.name} (${modelConfig.provider})`);
      
      // Auto-switch endpoint if needed
      if (modelConfig.provider !== this.currentEndpoint) {
        this.switchEndpoint(modelConfig.provider);
      }
      
      return true;
    } else {
      console.warn(`Model ${modelId} not found. Available:`, Object.keys(MODEL_CONFIGS));
      return false;
    }
  }

  // Get current configuration
  getCurrentConfig() {
    return {
      endpoint: API_ENDPOINTS[this.currentEndpoint],
      model: MODEL_CONFIGS[this.currentModel],
      apiKey: this.apiKeys[this.currentEndpoint]
    };
  }

  // Get available models for current endpoint
  getAvailableModels(): ModelConfig[] {
    return Object.values(MODEL_CONFIGS).filter(
      model => model.provider === this.currentEndpoint
    );
  }

  // Get models by capability
  getModelsByCapability(capability: string): ModelConfig[] {
    return Object.values(MODEL_CONFIGS).filter(
      model => model.capabilities.includes(capability)
    );
  }

  // Cost estimation
  estimateCost(inputTokens: number, outputTokens: number): number {
    const model = MODEL_CONFIGS[this.currentModel];
    if (model.costPerToken) {
      return (inputTokens + outputTokens) * model.costPerToken;
    }
    return 0; // Free or unknown cost
  }
}

// Usage examples
export function demonstrateModelSwitching() {
  const manager = new ModelManager();
  
  console.log('=== Model Switching Demo ===\n');
  
  // Show current config
  console.log('Current configuration:');
  console.log(manager.getCurrentConfig());
  console.log();
  
  // Switch to different models
  console.log('Switching to GPT-4o...');
  manager.switchModel('gpt-4o');
  console.log('Current config:', manager.getCurrentConfig());
  console.log();
  
  console.log('Switching to Salesforce XGen...');
  manager.switchModel('xgen_stream');
  console.log('Current config:', manager.getCurrentConfig());
  console.log();
  
  console.log('Switching to Claude...');
  manager.switchModel('claude-3-5-sonnet');
  console.log('Current config:', manager.getCurrentConfig());
  console.log();
  
  // Show available models for current endpoint
  console.log('Available models for current endpoint:');
  console.log(manager.getAvailableModels().map(m => `${m.name} (${m.id})`));
  console.log();
  
  // Show models with specific capability
  console.log('Models with vision capability:');
  console.log(manager.getModelsByCapability('vision').map(m => `${m.name} (${m.id})`));
  console.log();
  
  // Cost estimation
  console.log('Cost estimation for 1000 input + 500 output tokens:');
  console.log(`$${manager.estimateCost(1000, 500).toFixed(4)}`);
}
