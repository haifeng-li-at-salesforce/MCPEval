import { ModelClient } from './model-client';
import { LLMExpressModel } from '../model/model-configs';
import * as dotenv from 'dotenv';
import { Response } from './streaming-response';
import { ModelMessage } from './streaming-request';

// Load environment variables from .env file, overriding system environment variables
dotenv.config({ override: true });

const LLM_EXPRESS_BASE_URL = process.env.LLM_EXPRESS_GATEWAY_BASE_URL;
const LLM_EXPRESS_API_KEY = process.env.LLM_EXPRESS_GATEWAY_API_KEY;

export class LLMExpressModelClient extends ModelClient {
  private model: LLMExpressModel;
  constructor(model: LLMExpressModel) {
    super();
    this.model = model;
  }

  async chat(messages: ModelMessage[]): Promise<Response> {
    const url = `${LLM_EXPRESS_BASE_URL}/chat/completions`;
    const headers = {
      Authorization: `Bearer ${LLM_EXPRESS_API_KEY}`,
      'Content-Type': 'application/json',
    };
    const body = {
      model: this.model,
      messages: messages,
      stream: false,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { error: new Error(`Failed to chat: ${response.statusText}`), messages: null };
    }

    const data = (await response.json()) as any;
    //TODO: fix the messages format
    return { error: null, messages: data.choices[0].message.content };
  }
}

export async function testLLMExpressModelClient(model: LLMExpressModel) {
  const client = new LLMExpressModelClient(model);

  console.log('🚀 Testing LLMExpressModelClient...\n');
  console.log('🤖 Model: ', model);

  const response = await client.chat([
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' },
  ]);
  console.log(response);
}
