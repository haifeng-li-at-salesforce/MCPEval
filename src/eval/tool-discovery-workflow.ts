import { generateObject } from "ai";    
import { EinsteinDevModel } from "../model/model-configs";
import { EinsteinDevModelClient } from "../clients/streaming-client";
import { systemPrompt, barcodePrompt } from "../prompts/constant";


export async function toolDiscoveryWorkflow(): Promise<boolean> {

    const aiClient = new EinsteinDevModelClient(EinsteinDevModel.GPT5);
    const response = await aiClient.chat([{ role: 'system', content: systemPrompt }, { role: 'user', content: barcodePrompt }]);
    console.log(response);
    return false;
}