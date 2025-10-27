import { generateObject } from 'ai';
import { EinsteinDevModel } from '../model/model-configs';
import { EinsteinDevModelClient } from '../clients/streaming-client';
import { systemPrompt, barcodePrompt } from '../prompts/constant';
import { WorkflowAgent } from './workflow-agent';
import { expressLlmGateway } from '../clients/llm-gateways';

export async function toolDiscoveryWorkflow(): Promise<boolean> {
  const aiClient = new EinsteinDevModelClient(EinsteinDevModel.XGEN);
  const workflowAgent = new WorkflowAgent({
    model: aiClient,
    judgementModel: expressLlmGateway('gpt-4o'),
    systemPrompt: systemPrompt,
    tools: [],
    maxSteps: 10,
  });

  const result = await workflowAgent.evaluate(
    barcodePrompt,
    'create_mobile_lwc_barcode_scanner',
    true
  );
  console.log("AI Model tool invocation result:", result ? "Success" : "Failed");

  // const response = await aiClient.chat([{ role: 'system', content: systemPrompt }, { role: 'user', content: barcodePrompt }]);
  // console.log(response);
  return false;
}
