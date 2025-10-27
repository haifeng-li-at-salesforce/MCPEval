import { generateObject } from 'ai';
import { EinsteinDevModel } from '../model/model-configs';
import { EinsteinDevModelClient } from '../clients/streaming-client';
import { systemPrompt_V2, barcodePrompt } from '../prompts/constant';
import { ToolDiscoveryAgent } from './tool-discovery-agent';
import { expressLlmGateway } from '../clients/llm-gateways';

export async function toolDiscoveryWorkflow(): Promise<boolean> {
  const aiClient = new EinsteinDevModelClient(EinsteinDevModel.XGEN);
  const discoveryAgent = new ToolDiscoveryAgent({
    model: aiClient,
    judgementModel: expressLlmGateway('gpt-4o'),
    systemPrompt: systemPrompt_V2,
    tools: [],
    maxSteps: 10,
  });

  const result = await discoveryAgent.discover(
    barcodePrompt,
    'create_mobile_lwc_barcode_scanner',
    true
  );
  console.log("AI Model tool invocation result:", result ? "Success" : "Failed");

  // const response = await aiClient.chat([{ role: 'system', content: systemPrompt }, { role: 'user', content: barcodePrompt }]);
  // console.log(response);
  return false;
}
