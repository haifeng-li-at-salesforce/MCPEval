import { ModelMessage } from "./streaming-request";

export interface Response {
  error: Error | null;
  response: ModelMessage[]| null;
}
