import { ModelClient } from '../clients/model-client';
import { z } from 'zod';
import { generateObject, type LanguageModel } from 'ai';
import { en } from 'zod/v4/locales';
import { ModelMessage } from '../clients/streaming-request';

const A4V_URGENT_PROMPT = `
[ERROR] You did not use a tool in your previous response! Please retry with a tool use.\n\n# Reminder: Instructions for Tool Use\n\nTool uses are formatted using XML-style tags. The tool name is enclosed in opening and closing tags, and each parameter is similarly enclosed within its own set of tags. Here's the structure:\n\n<tool_name>\n<parameter1_name>value1</parameter1_name>\n<parameter2_name>value2</parameter2_name>\n...\n</tool_name>\n\nFor example:\n\n<attempt_completion>\n<result>\nI have completed the task...\n</result>\n</attempt_completion>\n\nAlways adhere to this format for all tool uses to ensure proper parsing and execution.\n\n# Next Steps\n\nIf you have completed the user's task, use the attempt_completion tool.\nIf you require additional information from the user, use the ask_followup_question tool.\nOtherwise, if you have not completed the task and do not need additional information, then proceed with the next step of the task.\n(This is an automated message, so do not respond to it conversationally.)\n`;

const TOOL_SCHEMA_FLEXIBLE = z.object({
  name: z.string(),
  params: z.any(), // Accepts any value: object, array, string, number, etc.
});

// Solution 3: Generic function to create tool schema with specific param schema
function createToolSchema<TParams extends z.ZodTypeAny>(paramSchema: TParams) {
  return z.object({
    name: z.string(),
    params: paramSchema,
  });
}

// Export the most flexible one as default
export const TOOL_SCHEMA = TOOL_SCHEMA_FLEXIBLE;

// Example usage of generic function:
// const UserToolSchema = createToolSchema(z.object({ userId: z.string() }));
// const ListToolSchema = createToolSchema(z.array(z.string()));

export type WorkflowAgentOptions = {
  codingModel: ModelClient;
  judgeModel: any; // LanguageModel type causes deep instantiation
  systemPrompt: string;
  maxSteps: number;
};

export type Tool = z.infer<typeof TOOL_SCHEMA>;

export const ToolCallEvalSchema = z.object({
  nextAction: z.enum(['continue', 'fail', 'success']).describe(`
      The evaluation result:
      - 'continue' → The model shows willingness to invoke the tool but needs clarification or setup
      - 'fail' → The model decides not to use the tool
      - 'success' → The model returns an XML structure with <use_mcp_tool> as the root element and <tool_name>, <server_name>, and <arguments> as its child elements.
    `),
  reasoning: z.string().describe('A brief explanation for your chosen action.'),
  originalContent: z.string().describe('The raw response content from the target coding model.'),
  followUpInput: z
    .string()
    .optional()
    .describe(
      `Suggested follow-up input to be sent to the model as a user message, guiding it toward invoking the tool when nextAction = 'continue'.
       If the operation involves file handling, suggest to the model to provide the full file content directly instead of invoking any file-writing tool.
       The follow-up should move the model toward the next logical step in completing the task.
       If the last assistant message represents a tool invocation —- where the XML root element is the tool name and its child elements are the tool parameters, then suggest a tool result message in the following format:
       "[tool_name] Result: <description of the result that allows progress to the next logical step>"
       For example, if the last assistant message is:
       <write_to_file><path>force-app/main/default/lwc/mobileBarcodeScanner/mobileBarcodeScanner.js</path><content>import { LightningElement } from 'lwc';
       </content></write_to_file>
      Then the suggested follow-up message should be:
       [write_to_file for="force-app/main/default/lwc/mobileBarcodeScanner/mobileBarcodeScanner.js"] Result: The file is written successfully.
       `
    ),
});

export class ToolDiscoveryAgent {
  private codingModel: ModelClient;
  private judgeModel: LanguageModel; // LanguageModel type causes deep instantiation
  private systemPrompt: string;

  private maxSteps: number;

  constructor(options: WorkflowAgentOptions) {
    this.codingModel = options.codingModel;
    this.judgeModel = options.judgeModel;
    this.systemPrompt = options.systemPrompt;

    this.maxSteps = options.maxSteps;
  }

  async discover(
    userPrompt: string,
    toolName: string,
    enableA4VSetting: boolean = false
  ): Promise<boolean> {
    const inputMessages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: userPrompt },
    ] as ModelMessage[];

    let judgementResponse: z.infer<typeof ToolCallEvalSchema> | null = null;
    let step: number = 0;
    do {
      const data = await this.codingModel.chat(inputMessages);
      if (data.error) {
        throw new Error('Error: ' + data.error.message);
      }

      const messages = data.messages;
      if (messages == null) {
        throw new Error('Messages are null');
      }

      console.log('role:', messages[0].role);
      console.log(messages[0].content);

      const { object } = await (generateObject as any)({
        model: this.judgeModel,
        schema: ToolCallEvalSchema,
        prompt: this.getJudgePrompt(toolName, messages[0].content),
      });

      inputMessages.push(...messages);
      step++;

      judgementResponse = { ...object };
      if (object.nextAction === 'continue' && object.followUpInput) {
        inputMessages.push({ role: 'user', content: object.followUpInput });
      }

      if (step == 1 && enableA4VSetting && object.nextAction === 'fail') {
        inputMessages.push({ role: 'user', content: A4V_URGENT_PROMPT });
        judgementResponse!.nextAction = 'continue';
      }

      console.log('🎯 Next action:', judgementResponse!.nextAction);
      console.log('💭 Reasoning:', judgementResponse!.reasoning);
      console.log('📝 Follow-up input:', judgementResponse!.followUpInput);
    } while (judgementResponse?.nextAction === 'continue' && step <= this.maxSteps);

    if (!judgementResponse) {
      throw new Error('Judgement response is null');
    }
    return judgementResponse.nextAction === 'success';
  }

  private getJudgePrompt(toolName: string, content: string): string {
    return `You are an assistant responsible for evaluating how willing the target coding model is to invoke the ${toolName} tool in response to a user request.

            The response from the target model to be analyzed is:
            \n${content}

\n        Your tasks are as follows:

1. Determine the next action, choosing one of the following options:

   a. continue — The model shows intent to use the tool but needs further clarification, setup, or confirmation before invoking it.

   b. fail — The model decides not to use the ${toolName} tool, opting instead to implement its own logic or use a different tool.

   c. success — The model outputs a valid XML structure with <use_mcp_tool> as the root element and <tool_name> set to ${toolName}.

2. Provide a brief explanation for your chosen action.

3. Include the original content — the raw response text from the target model.

4. Add an optional follow-up — If the next action is continue, suggest a follow-up input that could help the target model advance to the next logical step of the task.
   a. If the last assistant message is about directory path, confirm the default workspace setup so that model can proceed with the task.
   b. If the last assistant asks for confirmation to generate code using a tool, suggest 'proceed' as the follow-up input.
   c. If the last assistant message is a tool invocation —- where the XML root element is the tool name and its child elements define the tool parameters, then suggest a tool result message in the following format:
       "[tool_name] Result: <description of the result that allows progress to the next logical step>"
       For example, if the last assistant message is:
       <use_mcp_tool>
       <server_name>salesforce</server_name>
       <tool_name>create_mobile_lwc_barcode_scanner</tool_name>
       <arguments>
       <path>force-app/main/default/lwc/mobileBarcodeScanner/mobileBarcodeScanner.js</path>
       </arguments>
       </use_mcp_tool>
       Then the suggested follow-up message should be:
       <create_mobile_lwc_barcode_scanner Result: The LWC component is created successfully.>

`;
  }
}
