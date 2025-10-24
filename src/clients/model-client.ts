import { ModelMessage } from './streaming-request';
import { Response } from './streaming-response';
export abstract class ModelClient {
  //abstract chat(systemPrompt: string, userPrompt: string): Promise<Response>;
  abstract chat(messages: ModelMessage[]): Promise<Response>;
}
