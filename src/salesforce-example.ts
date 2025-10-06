// Example: How to implement model switching for Salesforce API (SF_API_URL)
// This is a hypothetical implementation showing the pattern

interface ModelConfiguration {
  id: string;
  name: string;
  maxTokens: number;
  endpoint: string;
  headers?: Record<string, string>;
}

// Configuration for different Salesforce models
const SF_MODEL_CONFIG: Record<string, ModelConfiguration> = {
  'xgen_stream': {
    id: 'xgen_stream',
    name: 'XGen Stream',
    maxTokens: 8192,
    endpoint: 'https://api.salesforce.com/einstein/gpt/code/v1.1/chat/generations',
    headers: {
      'x-llm-provider': 'InternalTextGeneration'
    }
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    maxTokens: 128000,
    endpoint: 'https://api.salesforce.com/einstein/gpt/code/v1.1/chat/generations'
  },
  'claude-3-7-sonnet': {
    id: 'llmgateway__BedrockAnthropicClaude37Sonnet',
    name: 'Claude 3.7 Sonnet',
    maxTokens: 200000,
    endpoint: 'https://api.salesforce.com/einstein/gpt/code/v1.1/chat/generations'
  },
  'gemini-2-5-pro': {
    id: 'llmgateway__VertexAIGeminiPro25',
    name: 'Gemini 2.5 Pro',
    maxTokens: 2000000,
    endpoint: 'https://api.salesforce.com/einstein/gpt/code/v1.1/chat/generations'
  }
};

class SalesforceModelClient {
  private currentModel: string;
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = 'https://api.salesforce.com/einstein/gpt/code/v1.1') {
    this.baseUrl = baseUrl;
    this.apiKey = process.env.SF_API_KEY || '';
    this.currentModel = process.env.SF_SELECTED_MODEL || 'xgen_stream';
  }

  // Switch model at runtime
  switchModel(modelId: string): boolean {
    if (SF_MODEL_CONFIG[modelId]) {
      this.currentModel = modelId;
      console.log(`Switched to model: ${SF_MODEL_CONFIG[modelId].name}`);
      return true;
    } else {
      console.warn(`Model ${modelId} not found. Available models:`, Object.keys(SF_MODEL_CONFIG));
      return false;
    }
  }

  // Get current model configuration
  getCurrentModelConfig(): ModelConfiguration {
    return SF_MODEL_CONFIG[this.currentModel];
  }

  // Make a request with the current model
  async makeRequest(messages: Array<{role: string, content: string}>, options: any = {}) {
    const modelConfig = this.getCurrentModelConfig();
    
    const requestBody = {
      messages,
      model: modelConfig.id,
      generation_settings: {
        max_tokens: options.maxTokens || modelConfig.maxTokens,
        parameters: options.parameters || {}
      },
      system_prompt_strategy: "use_model_parameter"
    };

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'x-client-feature-id': 'EinsteinGptForDevelopers',
      ...modelConfig.headers
    };

    try {
      const response = await fetch(`${modelConfig.endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  // Example: Switch between models for different use cases
  async demonstrateModelSwitching() {
    console.log('=== Salesforce Model Switching Demo ===\n');

    // Start with XGen (Salesforce internal model)
    console.log('1. Using XGen (Salesforce internal model):');
    this.switchModel('xgen_stream');
    const response1 = await this.makeRequest([
      { role: 'user', content: 'Generate Apex code for a simple contact query' }
    ]);
    console.log('XGen Response:', response1.choices?.[0]?.message?.content?.substring(0, 100) + '...\n');

    // Switch to GPT-4o for general reasoning
    console.log('2. Switching to GPT-4o for general reasoning:');
    this.switchModel('gpt-4o');
    const response2 = await this.makeRequest([
      { role: 'user', content: 'Explain the benefits of using Salesforce Einstein AI' }
    ]);
    console.log('GPT-4o Response:', response2.choices?.[0]?.message?.content?.substring(0, 100) + '...\n');

    // Switch to Claude for complex analysis
    console.log('3. Switching to Claude 3.7 Sonnet for complex analysis:');
    this.switchModel('claude-3-7-sonnet');
    const response3 = await this.makeRequest([
      { role: 'user', content: 'Analyze the pros and cons of different Salesforce deployment strategies' }
    ]);
    console.log('Claude Response:', response3.choices?.[0]?.message?.content?.substring(0, 100) + '...\n');

    // Switch to Gemini for large context
    console.log('4. Switching to Gemini 2.5 Pro for large context processing:');
    this.switchModel('gemini-2-5-pro');
    const response4 = await this.makeRequest([
      { role: 'user', content: 'Process this large document and summarize the key points...' }
    ]);
    console.log('Gemini Response:', response4.choices?.[0]?.message?.content?.substring(0, 100) + '...\n');
  }
}

// Usage example
async function runSalesforceExample() {
  const client = new SalesforceModelClient();
  
  try {
    await client.demonstrateModelSwitching();
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Export for use in other files
export { SalesforceModelClient, SF_MODEL_CONFIG };

// Uncomment to run the demo
// runSalesforceExample();
