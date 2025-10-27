import { TaskResult } from 'vitest-evals';
import { generateText, LanguageModel } from 'ai';

export function createTaskRunner(model: LanguageModel, tools?: any) {
  return async (input: string): Promise<TaskResult> => {
    const { text } = await generateText({
      model,
      prompt: input,
      tools: tools || undefined,
      toolChoice: 'auto',
    });

    const result = text.trim();
    return {
      result: result, // Return the actual result, not hardcoded message
    };
  };
}
