// Example: How to implement model switching for Salesforce API (SF_API_URL)
// This is a hypothetical implementation showing the pattern

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export enum EinsteinDevModel {
  GPT5 = 'GPT5',
  XGEN = 'XGEN',
}

export enum LLMExpressModel {
  GEMINI_2_5_PRO = 'gemini-2.5-pro',
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-20250219',
  CLAUDE_4_SONNET = 'claude-sonnet-4-20250514',
  GPT_5 = 'gpt-5',
  GPT_5_MINI = 'gpt-5-mini',
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
}

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
  parameters: {},
};

export const QWEN_CONFIG: ModelConfiguration = {
  model: 'xgen_stream',
  apiKey: process.env.XGEN_API_KEY || '',
  tenantId: process.env.XGEN_TENANT_ID || '',
  featureId: process.env.XGEN_FEATURE_ID || 'EinsteinForDevelopers',
  baseUrl: process.env.XGEN_BASE_URL || 'https://test.api.salesforce.com/einstein/gpt/code/v1.1',
  modelProvider: 'InternalTextGeneration',
  maxTokens: 2048,
  parameters: { command_source: 'Chat' },
};

export const modelConfigs: Record<EinsteinDevModel, ModelConfiguration> = {
  [EinsteinDevModel.GPT5]: OPENAI_GPT5_CONFIG,
  [EinsteinDevModel.XGEN]: QWEN_CONFIG,
};

// Uncomment to run the demo
// runSalesforceExample();
