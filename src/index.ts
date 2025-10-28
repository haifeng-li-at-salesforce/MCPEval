import { testStreamingClient } from './clients/streaming-client';
import { testAiClient } from './utils/ai-client';
import { LLMExpressModel, EinsteinDevModel, QWEN_CONFIG } from './model/model-configs';
import { testLLMExpressModelClient } from './clients/chatcompletion-client';
import { toolDiscoveryWorkflow } from './eval/tool-discovery-workflow';
import { barcodePrompt } from './prompts/constant';

// Export MCP tool loader
export { getMCPTools } from './mcp/mcp-tool-loader';

// Initialize the OpenAI client

async function main() {
  //testStreamingClient(QWEN_CONFIG);
  //await testAiClient();
  await toolDiscoveryWorkflow(EinsteinDevModel.XGEN, barcodePrompt, 'create_mobile_lwc_barcode_scanner');
  //testLLMExpressModelClient(LLMExpressModel.GEMINI_2_5_FLASH);
}

// Run the main function
main();
