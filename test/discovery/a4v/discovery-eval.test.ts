import { describeEval, ToolCallScorer } from 'vitest-evals';
import { barcodePrompt } from '../../../src/prompts/constant';
import { EinsteinDevModel } from '../../../src/model/model-configs';
import { toolDiscoveryWorkflow } from '../../../src/eval/tool-discovery-workflow';
const testModel = EinsteinDevModel.XGEN;

describeEval('A4V mobile mcp tool discovery', {
    data: async () => [
        {
            input: barcodePrompt,
            expectedTools: [
                {
                    name: 'create_mobile_lwc_barcode_scanner',
                    arguments: {
                    },
                },
            ],
        },
    ],
    task: async ( input ) => {
        const evalResult = await toolDiscoveryWorkflow(testModel, input, 'create_mobile_lwc_barcode_scanner');
        return {
            result: evalResult.success ? "invoked" : "not invoked",
            toolCalls: evalResult.toolCall ? [evalResult.toolCall] : [],
        };
    },
    scorers: [
        ToolCallScorer({
            params: "fuzzy",
            fuzzyOptions: {
                coerceTypes: true
            }
        })
    ]
    
});