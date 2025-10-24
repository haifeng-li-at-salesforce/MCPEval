import { ModelClient } from './model-client';
import { LLMExpressModel } from '../model/model-configs';
import * as dotenv from 'dotenv';
import { Response } from './streaming-response';

dotenv.config();

const LLM_EXPRESS_BASE_URL = process.env.LLM_EXPRESS_GATEWAY_BASE_URL;
const LLM_EXPRESS_API_KEY = process.env.LLM_EXPRESS_GATEWAY_API_KEY;

export class LLMExpressModelClient extends ModelClient {
  private model: LLMExpressModel;
  constructor(model: LLMExpressModel) {
    super();
    this.model = model;
  }

  async chat(systemPrompt: string, userPrompt: string): Promise<Response> {
    const url = `${LLM_EXPRESS_BASE_URL}/chat/completions`;
    const headers = {
      Authorization: `Bearer ${LLM_EXPRESS_API_KEY}`,
      'Content-Type': 'application/json',
    };
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { error: new Error(`Failed to chat: ${response.statusText}`), response: null };
    }

    const data = await response.json() as any;
    return { error: null, response: data.choices[0].message.content };
  }
}

export async function testLLMExpressModelClient(model: LLMExpressModel) {
  const client = new LLMExpressModelClient(model);

  console.log('🚀 Testing LLMExpressModelClient...\n');
  console.log('🤖 Model: ', model);

  const response = await client.chat(
    'You are a helpful assistant.',
    'What is the capital of France?'
  );
  console.log(response);
}
