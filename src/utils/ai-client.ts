import { EinsteinDevModelClient, OpenAIStreamingClient } from "../clients/streaming-client";
import { EinsteinDevModel, LLMExpressModel, modelConfigs } from "../model/model-configs";
import { Response } from "../clients/streaming-response";
import { LLMExpressModelClient } from "../clients/chatcompletion-client";





export async function testAiClient() {
  const client = new EinsteinDevModelClient(EinsteinDevModel.XGEN);
  const response = await client.chat('You are a helpful assistant.', 'What is the capital of France?');
  console.log(response);

  const expressClient = new LLMExpressModelClient(LLMExpressModel.GEMINI_2_5_FLASH);
  const expressResponse = await expressClient.chat('You are a helpful assistant.', 'What is the capital of France?');
  console.log(expressResponse);
}