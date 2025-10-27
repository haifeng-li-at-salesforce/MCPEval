import { describeEval } from 'vitest-evals';
import { createTaskRunner } from './utils/task-runner';

import dotenv from 'dotenv';
import { google } from '@ai-sdk/google';
import { einsteinLlmGateway, expressLlmGateway } from './utils/llm-gateways';

// Define models to test
const models = [
  { name: 'gpt-4o-llmgateway', model: expressLlmGateway('gpt-4o') },
  { name: 'gemini-2.5-flash', model: google('gemini-2.5-flash') },
  {
    name: 'xgen_einstein',
    model: einsteinLlmGateway('xgen_stream', { 'X-LLM-Provider': 'InternalTextGeneration' }),
  },
  { name: 'OpenAIGPT5_einstein', model: einsteinLlmGateway('llmgateway__OpenAIGPT5') },
];

// Test data
const testData = async () => [
  {
    input: 'What is the 5th Fibonacci number?  Return ONLY the numeric answer, nothing else.',
    expected: '5',
  },
  {
    input: 'What is the 7th Fibonacci number? Return ONLY the numeric answer, nothing else.',
    expected: '13',
  },
];

// Scorer function
const fibonacciScorer = async ({ output, expected }: { output: string; expected: string }) => {
  const score = output.includes(expected) ? 1.0 : 0.0;
  return { score };
};

// Parameter-driven tests: Create a test suite for each model
models.forEach(({ name, model }) => {
  describeEval(`Fibonacci Number Explanation - ${name}`, {
    data: testData,
    task: createTaskRunner(model),
    scorers: [fibonacciScorer],
    threshold: 1.0, // All tests must pass
  });
});
