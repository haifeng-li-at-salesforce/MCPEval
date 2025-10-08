
import { testStreamingClient } from './streaming-client';
import { QWEN_CONFIG } from './model-configs';

// Initialize the OpenAI client

async function main() {

   testStreamingClient(QWEN_CONFIG);
}

// Run the main function
main();
