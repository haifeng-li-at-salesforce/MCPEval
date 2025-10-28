import { EinsteinDevModel } from '../model/model-configs';
import { EinsteinDevModelClient } from '../clients/streaming-client';
import { systemPrompt_V2, barcodePrompt } from '../prompts/constant';
import { ToolDiscoveryAgent, ToolDiscoveryResult } from './tool-discovery-agent';
import { expressLlmGateway } from '../ai-sdk/llm-gateways';

export async function toolDiscoveryWorkflow(model: EinsteinDevModel, userPrompt: string, targetToolName: string): Promise<ToolDiscoveryResult> {
  const aiClient = new EinsteinDevModelClient(model);
  const discoveryAgent = new ToolDiscoveryAgent({
    codingModel: aiClient,
    judgeModel: expressLlmGateway('gpt-4o'),
    systemPrompt: systemPrompt_V2,
    maxSteps: 10,
  });

  const result = await discoveryAgent.discover(
    userPrompt,
    targetToolName,
    true
  );
  console.log('AI Model tool invocation result:', result ? 'Success' : 'Failed');
  
  return result;
  

  // const response = await aiClient.chat([{ role: 'system', content: systemPrompt }, { role: 'user', content: barcodePrompt }]);
  // console.log(response);
  //return false;
}
