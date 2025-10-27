import { describeEval } from 'vitest-evals';
import { createTaskRunner } from './utils/task-runner';

import dotenv from 'dotenv';
import { google } from '@ai-sdk/google';
import { einsteinLlmGateway, expressLlmGateway } from './utils/llm-gateways';
import { getMCPTools } from '../src/mcp/mcp-tool-loader';


// Define models to test
const models = [
  { 
    name: 'gemini-2.5-flash', 
    model: google('gemini-2.5-flash'), 
    utilizeModelMcpTools: false 
  },
  { 
    name: 'gpt-4o-llmgateway', 
    model: expressLlmGateway('gpt-4o'), 
    utilizeModelMcpTools: false 
  },
  { 
    name: 'xgen_einstein',
    model: einsteinLlmGateway('xgen_stream', { 'X-LLM-Provider': 'InternalTextGeneration' }),
    utilizeModelMcpTools: false 
  },
  { 
    name: 'OpenAIGPT5_einstein', 
    model: einsteinLlmGateway('llmgateway__OpenAIGPT5'), 
    utilizeModelMcpTools: false 
  }
];
const mcpTools = await getMCPTools('Salesforce DX');


const lwcGenerationTestData = async () => [
  {
    input: 'As a junior developer, you are tasked with implementing a Lightning Web Component (LWC) feature for a mobile sales app running on iOS devices. The feature should use the `BarcodeScanner` API to allow the user to scan a product barcode. Upon scanning a barcode, the app should display the barcode type and value on the screen. Ensure that the barcode scanner only scans for QR codes and EAN-13 barcodes, and provide a user-friendly message if the scanner is not available.',
    expected: `import { getBarcodeScanner } from 'lightning/mobileCapabilities`
  },
];

const lwcGenerationScorer = async ({ output, expected }: { output: string; expected: string }) => {
  const score = output.includes(expected) ? 1.0 : 0.0;
  return { score }
};


const testConfigs = {
    lwcGeneration: {    
        testData: lwcGenerationTestData,
        scorer: lwcGenerationScorer,
        threshold: 1.0,
    },
}

models.forEach(({ name, model, utilizeModelMcpTools }) => {

    const taskRunner = createTaskRunner(
        model, utilizeModelMcpTools ? mcpTools : undefined
    );
    
    Object.entries(testConfigs).forEach(([testName, testConfig]) => {
        const evalConfig = {
            data: testConfig.testData,
            task: taskRunner,
            scorers: [testConfig.scorer],
            threshold: testConfig.threshold,
        }
        describeEval(`${testName} - ${name}`, evalConfig);
    });
});
