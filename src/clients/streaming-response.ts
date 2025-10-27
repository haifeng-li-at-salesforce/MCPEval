import { ModelMessage } from './streaming-request';

export interface Response {
  error: Error | null;
  messages: ModelMessage[] | null;
}
