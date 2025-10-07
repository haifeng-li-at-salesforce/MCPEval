// Example: How to implement model switching for Salesforce API (SF_API_URL)
// This is a hypothetical implementation showing the pattern

export interface ModelConfiguration {
  model: string;
  apiKey: string;
  tenantId: string;
  featureId: string;
  baseUrl: string;
  maxTokens: number;
  modelProvider?: string;
  parameters?: Record<string, any>;
}


export const OPENAI_GPT5_CONFIG: ModelConfiguration = {
  model: 'llmgateway__OpenAIGPT5',
  apiKey: process.env.OPENAI_API_KEY || '',
  tenantId: process.env.OPENAI_TENANT_ID || '',
  featureId: process.env.OPENAI_FEATURE_ID || 'EinsteinForDevelopers',
  baseUrl: process.env.OPENAI_BASE_URL || 'https://test.api.salesforce.com/einstein/gpt/code/v1.1',
  maxTokens: 2048,
  parameters: {}
};

export const QWEN_CONFIG: ModelConfiguration = {
  model: 'xgen_stream',
  apiKey: process.env.XGEN_API_KEY || '',
  tenantId: process.env.XGEN_TENANT_ID || '',
  featureId: process.env.XGEN_FEATURE_ID || 'EinsteinForDevelopers',
  baseUrl: process.env.XGEN_BASE_URL || 'https://test.api.salesforce.com/einstein/gpt/code/v1.1',
  modelProvider: 'InternalTextGeneration',
  maxTokens: 2048,
  parameters: {"command_source": "Chat"}
};






// Uncomment to run the demo
// runSalesforceExample();
