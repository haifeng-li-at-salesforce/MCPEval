import { describe, it, expect } from 'vitest';
import { EinsteinDevModelClient } from '../src/clients/streaming-client';
import { LLMExpressModelClient } from '../src/clients/chatcompletion-client';
import { EinsteinDevModel, LLMExpressModel } from '../src/model/model-configs';

describe('EinsteinDevModel Tests', () => {
  // Test all models in EinsteinDevModel enum
  Object.values(EinsteinDevModel).forEach((model) => {
    it(`should return Paris for capital of France using ${model}`, async () => {
      const client = new EinsteinDevModelClient(model);
      const result = await client.chat(
        'You are a helpful assistant.',
        'What is the capital of France?'
      );

      expect(result.error).toBeNull();
      expect(result.response).not.toBeNull();
      expect(result.response?.toLowerCase()).toContain('paris');
    }, 60000); // 60 second timeout for API calls
  });
});

describe('LLMExpressModel Tests', () => {
  // Test all models in LLMExpressModel enum
  Object.values(LLMExpressModel).forEach((model) => {
    it(`should return Paris for capital of France using ${model}`, async () => {
      const client = new LLMExpressModelClient(model);
      const result = await client.chat(
        'You are a helpful assistant.',
        'What is the capital of France?'
      );

      expect(result.error).toBeNull();
      expect(result.response).not.toBeNull();
      expect(result.response?.toLowerCase()).toContain('paris');
    }, 60000); // 60 second timeout for API calls
  });
});
