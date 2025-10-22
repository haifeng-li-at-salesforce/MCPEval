
import { testStreamingClient } from './clients/streaming-client';
import { testAiClient } from './utils/ai-client';
import { LLMExpressModel, EinsteinDevModel, QWEN_CONFIG } from './model/model-configs';
import { testLLMExpressModelClient } from './clients/chatcompletion-client';

// Initialize the OpenAI client

async function main() {

   //testStreamingClient(QWEN_CONFIG);
   testAiClient();
   //testLLMExpressModelClient(LLMExpressModel.GEMINI_2_5_FLASH);
}

// Run the main function
main();
