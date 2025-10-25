// Create custom LLM Gateway provider

import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';
import * as dotenv from 'dotenv';
import { createParser, EventSourceMessage } from 'eventsource-parser';

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
              parameters: {
                // command_source: 'Chat',
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Einstein API error: ${response.status} - ${errorText}`);
      }

      const text = await getResponseText(response);

      return {
        content: [{ type: 'text', text }],
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

  async function getResponseText(response: Response): Promise<string> {
    const textContent: string[] = [];

    // Create a parser to process SSE events
    const parser = createParser({
      onEvent: (event: EventSourceMessage) => {
        if (event.event === 'error') {
          throw new Error(`Einstein API error: ${event.data}`);
        }
        if (event.event === 'generation' && event.data !== '[DONE]') {
          const jsonData = JSON.parse(event.data);
          // Einstein API returns the full content in each chunk, not deltas
          const content: string | undefined =
            jsonData.generation_details?.generations?.[0]?.content;
          if (typeof content === 'string' && content.length > 0) {
            textContent.push(content);
          }
        }
      },
      onError: (error: Error) => {
        throw error;
      },
    });

    // Read the response body stream and feed it to the parser
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          parser.feed(chunk);
        }
      } finally {
        reader.releaseLock();
      }
    }

    const text = textContent.join('');
    return text;
  }
}
