
export interface ModelMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }

  
export interface RequestBody {
    model: string;
    messages: ModelMessage[];
    max_tokens?: number;
    generation_settings?: {
      max_tokens: number;
      parameters: Record<string, any>;
    };
    temperature?: number;
    stream?: boolean;
  }

  export interface ToolInvocation {
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }
  
export interface DoneResponse {
    event: 'generation';
    data:['DONE']

}
export interface EventResponse {
  event: 'generation';
  data: {
    id: string;
    generation_details: {
      generations: {
        id: string;
        role: string;
        content: string;
        timestamp: number | null;
        parameters: {
          finish_reason: string;
          index: number;
          logprobs: number | null;
        };
        generation_safety_score: null;
        generation_content_quality: null;
        tool_invocations: ToolInvocation[] | null;
      }[];
      parameters: {
        provider: string;
        created: number;
        model: string;
        system_fingerprint: string;
        object: string;
        usage: object | null;
      };
      other_details: null;
    };
  };
}
