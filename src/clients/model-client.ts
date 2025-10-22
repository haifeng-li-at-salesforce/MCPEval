import { Response } from "./streaming-response";
export abstract class ModelClient {
    abstract chat(systemPrompt: string, userPrompt: string): Promise<Response>;
}