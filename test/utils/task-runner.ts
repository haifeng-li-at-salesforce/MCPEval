import { TaskResult } from "vitest-evals";
import { generateText, LanguageModel } from "ai";



export function createTaskRunner(model: LanguageModel) {
    return async (input: string): Promise<TaskResult> => {

        const { text } = await generateText({
            model,
            prompt: input
        });
        
        const result = text.trim();
        return {
            result: `The Fibonacci number is ${result}`,
        };
        
    }
}
  