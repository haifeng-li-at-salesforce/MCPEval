import { TaskResult } from "vitest-evals";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import * as dotenv from "dotenv";
// import { ProviderV2 } from "@ai-sdk/provider";
//import { google } from "@ai-sdk/google";

dotenv.config();

// Create custom LLM Gateway provider
const llmGateway = createOpenAI({
    baseURL: "https://eng-ai-model-gateway.sfproxy.devx-preprod.aws-esvc1-useast2.aws.sfdc.cl",
    apiKey: process.env.LLM_GW_EXPRESS_KEY || "sk-oEsGw3xlTFoO1Do_6OlZdw",
});

export function createTaskRunner() {
    return async (input: string): Promise<TaskResult> => {

        // Use custom LLM Gateway to calculate the Fibonacci number
        try {
            const { text } = await generateText({
                model: llmGateway("gpt-4o"),
                // model: google("gemini-2.5-flash"),
                prompt: input
            });
            
            const result = text.trim();
            return {
                result: `The Fibonacci number is ${result}`,
            };
        } catch (error) {
            return {
                result: `Error calculating Fibonacci number: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }
}
  