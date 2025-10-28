import { describeEval, ToolCallScorer, TaskResult } from 'vitest-evals';
import { barcodePrompt } from '../../../src/prompts/constant';
import { EinsteinDevModel } from '../../../src/model/model-configs';
import { toolDiscoveryWorkflow } from '../../../src/eval/tool-discovery-workflow';
const testModel = EinsteinDevModel.XGEN;
const toolName = 'create_mobile_lwc_barcode_scanner';

describeEval('A4V mobile mcp tool discovery', {
    data: async () => [
        {
            input: barcodePrompt,
            expectedTools: [
                {
                    name: toolName,
                    arguments: {
                    },
                },
            ],
        },
    ],
    task: toolDiscoveryTask(testModel, toolName),
    scorers: [
        ToolCallScorer({
            params: "fuzzy",
            fuzzyOptions: {
                coerceTypes: true
            }
        })
    ]
    
});

function toolDiscoveryTask(model: EinsteinDevModel, toolName: string) {
    return async function(input: string): Promise<TaskResult> {
        const evalResult = await toolDiscoveryWorkflow(model, input, toolName);
        return {
            result: evalResult.success ? "invoked" : "not invoked",
            toolCalls: evalResult.toolCall ? [evalResult.toolCall] : [],
        };
    }
}