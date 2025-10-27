// Create custom LLM Gateway provider

import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';
import * as dotenv from 'dotenv';

dotenv.config();

export const expressLlmGateway = createOpenAI({
  baseURL: 'https://eng-ai-model-gateway.sfproxy.devx-preprod.aws-esvc1-useast2.aws.sfdc.cl',
  apiKey: process.env.LLM_GW_EXPRESS_KEY || 'sk-oEsGw3xlTFoO1Do_6OlZdw',
});

export function einsteinLlmGateway(
  modelName: string,
  headers?: Record<string, string | undefined>
): LanguageModel {
  return {
    doGenerate: async (options: any) => {
      const requestHeaders = {
        Authorization: `API_KEY ${process.env.EINSTEIN_API_KEY || '651192c5-37ff-440a-b930-7444c69f4422'}`,
        'Content-Type': 'application/json',
        'X-Client-Feature-Id': 'EinsteinForDevelopers',
        'X-Sfdc-Core-Tenant-Id': 'core/falcontest1-core4sdb6/00DSG000002tHLd2AM',
        ...headers,
      };
      const response = await fetch(
        'https://test.api.salesforce.com/einstein/gpt/code/v1.1/chat/generations/stream',
        {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({
            model: modelName,
            messages: options.prompt.map((msg: any) => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : msg.content[0].text,
            })),
            generation_settings: {
              // max_tokens: 2048,
              // parameters: {
              // },
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Einstein API error: ${response.statusText} - ${errorText}`);
      }

      // Parse SSE response
      const text = await response.text();
      const lines = text.split('\n');
      let textContent: string[] = [];

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonData = JSON.parse(line.substring(6));
            // Einstein API returns the full content in each chunk, not deltas
            const content: string | undefined =
              jsonData.generation_details?.generations?.[0]?.content;
            if (typeof content === 'string' && content.length > 0) {
              textContent.push(content); // Use the latest non-empty content
            }
          } catch (e) {
            // Ignore parsing errors for non-JSON lines
          }
        }
      }

      return {
        content: [{ type: 'text', text: textContent.join('') }],
        finishReason: 'stop',
        usage: {
          inputTokens: undefined,
          outputTokens: undefined,
          totalTokens: undefined,
        },
      };
    },
    specificationVersion: 'v2',
    provider: 'einstein',
    modelId: modelName,
    defaultObjectGenerationMode: 'json',
  } as any;
}
