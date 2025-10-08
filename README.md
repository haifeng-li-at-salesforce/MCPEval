# MCPEval - Salesforce AI Streaming Client

A TypeScript client library for streaming chat completions from Salesforce AI APIs using Server-Sent Events (SSE). Built on top of the OpenAI SDK for seamless integration with Salesforce's Einstein GPT Code services.

## Features

- 🚀 **Streaming Support**: Real-time streaming of AI responses using SSE
- 🔄 **Event-Based Architecture**: Built on Node.js EventEmitter for flexible event handling
- 🎯 **Multiple Model Support**: Easy switching between different AI models (OpenAI GPT-5, Qwen, etc.)
- 🔧 **Configurable**: Flexible configuration system with environment variable support
- 📦 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🛡️ **Error Handling**: Robust error handling and event-based error reporting

## Installation

```bash
npm install
```

### Dependencies

- `openai`: ^4.28.0 - OpenAI SDK for API client
- `dotenv`: ^17.2.3 - Environment variable management
- TypeScript 5.3.0+

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# OpenAI GPT-5 Configuration
OPENAI_API_KEY=your_api_key_here
OPENAI_TENANT_ID=your_tenant_id_here
OPENAI_FEATURE_ID=EinsteinForDevelopers
OPENAI_BASE_URL=https://test.api.salesforce.com/einstein/gpt/code/v1.1

# Xgen/Qwen Configuration
XGEN_API_KEY=your_xgen_api_key_here
XGEN_TENANT_ID=your_xgen_tenant_id_here
XGEN_FEATURE_ID=EinsteinForDevelopers
XGEN_BASE_URL=https://test.api.salesforce.com/einstein/gpt/code/v1.1
```

### Model Configuration

The library provides pre-configured model settings in `model-configs.ts`:

```typescript
import { OPENAI_GPT5_CONFIG, QWEN_CONFIG } from './model-configs';

// OpenAI GPT-5 Configuration
const openAIConfig = OPENAI_GPT5_CONFIG;

// Qwen/Xgen Configuration  
const qwenConfig = QWEN_CONFIG;
```

You can also create custom configurations:

```typescript
import { ModelConfiguration } from './model-configs';

const customConfig: ModelConfiguration = {
  model: 'your_model_name',
  apiKey: 'your_api_key',
  tenantId: 'your_tenant_id',
  featureId: 'your_feature_id',
  baseUrl: 'https://api.salesforce.com/endpoint',
  maxTokens: 2048,
  modelProvider: 'ProviderName', // Optional
  parameters: { /* custom parameters */ } // Optional
};
```

## Usage

### Basic Example

```typescript
import { OpenAIStreamingWebClient } from './streaming-client';
import { OPENAI_GPT5_CONFIG } from './model-configs';

const client = new OpenAIStreamingWebClient(OPENAI_GPT5_CONFIG);

await client.chat([
  { role: 'user', content: 'Write a Fibonacci function in TypeScript' }
], {
  maxTokens: 2048,
  temperature: 0.7,
  onContent: (content: string) => {
    // Handle streamed content
    process.stdout.write(content);
  },
  onEnd: () => {
    console.log('\nStreaming completed!');
  },
  onError: (error: Error) => {
    console.error('Error:', error.message);
  }
});
```

### Advanced Example with Event Handlers

```typescript
import { OpenAIStreamingWebClient } from './streaming-client';
import { QWEN_CONFIG } from './model-configs';
import { EventResponse } from './streaming-request';

const client = new OpenAIStreamingWebClient(QWEN_CONFIG);

let fullResponse = '';
let chunkCount = 0;

await client.chat([
  { role: 'system', content: 'You are a helpful coding assistant.' },
  { role: 'user', content: 'Explain async/await in JavaScript' }
], {
  maxTokens: 4096,
  temperature: 0.5,
  
  // Handle content chunks
  onContent: (content: string) => {
    fullResponse += content;
    process.stdout.write(content);
  },
  
  // Handle raw chunks with metadata
  onChunk: (chunk: EventResponse) => {
    chunkCount++;
    console.log(`Chunk ${chunkCount}: ${chunk.data.generation_details.generations.length} generations`);
  },
  
  // Handle errors
  onError: (error: Error) => {
    console.error('Stream error:', error);
  },
  
  // Handle completion
  onEnd: () => {
    console.log(`\n\nCompleted! Received ${chunkCount} chunks`);
    console.log(`Total response length: ${fullResponse.length} characters`);
  }
});
```

### Using Event Listeners

You can also use event listeners directly:

```typescript
const client = new OpenAIStreamingWebClient(OPENAI_GPT5_CONFIG);

// Add event listeners
client.on('content', (content: string) => {
  console.log('Content:', content);
});

client.on('chunk', (chunk: EventResponse) => {
  console.log('Raw chunk:', chunk);
});

client.on('error', (error: Error) => {
  console.error('Error:', error);
});

client.on('end', () => {
  console.log('Stream ended');
});

// Start the chat
await client.chat([
  { role: 'user', content: 'Hello!' }
]);
```

## API Reference

### OpenAIStreamingWebClient

The main client class for streaming chat completions.

#### Constructor

```typescript
constructor(config: ModelConfiguration)
```

**Parameters:**
- `config`: Model configuration object containing API credentials and settings

#### Methods

##### `chat(messages, options)`

Stream a chat completion with the given messages.

```typescript
async chat(
  messages: ModelMessage[], 
  options?: ChatOptions
): Promise<void>
```

**Parameters:**

- `messages`: Array of chat messages
  ```typescript
  interface ModelMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }
  ```

- `options`: Optional chat configuration
  ```typescript
  interface ChatOptions {
    maxTokens?: number;      // Default: 2048
    temperature?: number;    // Optional
    onContent?: (content: string) => void;
    onChunk?: (chunk: EventResponse) => void;
    onError?: (error: Error) => void;
    onEnd?: () => void;
  }
  ```

##### `post(request)`

Low-level method to create a streaming request.

```typescript
async post(request: RequestBody): Promise<Stream<unknown>>
```

**Parameters:**
- `request`: Request body conforming to the RequestBody interface

#### Events

The client extends EventEmitter and emits the following events:

- `content`: Emitted for each content chunk received
  ```typescript
  client.on('content', (content: string) => { /* ... */ });
  ```

- `chunk`: Emitted for each raw chunk with full metadata
  ```typescript
  client.on('chunk', (chunk: EventResponse) => { /* ... */ });
  ```

- `error`: Emitted when an error occurs
  ```typescript
  client.on('error', (error: Error) => { /* ... */ });
  ```

- `end`: Emitted when streaming completes
  ```typescript
  client.on('end', () => { /* ... */ });
  ```

### Types

#### ModelConfiguration

```typescript
interface ModelConfiguration {
  model: string;              // Model identifier
  apiKey: string;             // API authentication key
  tenantId: string;           // Salesforce tenant ID
  featureId: string;          // Feature identifier
  baseUrl: string;            // API base URL
  maxTokens: number;          // Maximum tokens to generate
  modelProvider?: string;     // Optional model provider
  parameters?: Record<string, any>; // Optional model parameters
}
```

#### RequestBody

```typescript
interface RequestBody {
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
```

#### EventResponse

```typescript
interface EventResponse {
  event: 'generation';
  data: {
    id: string;
    generation_details: {
      generations: Array<{
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
      }>;
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
```

## Testing

Run the included test function:

```typescript
import { testStreamingClient } from './streaming-client';
import { OPENAI_GPT5_CONFIG } from './model-configs';

// Test the streaming client
await testStreamingClient(OPENAI_GPT5_CONFIG);
```

## Build and Development

```bash
# Build TypeScript to JavaScript
npm run build

# Run in development mode
npm run dev

# Watch mode for development
npm run watch

# Clean build artifacts
npm run clean
```

## Project Structure

```
MCPEval/
├── src/
│   ├── index.ts              # Main entry point
│   ├── streaming-client.ts   # OpenAIStreamingWebClient implementation
│   ├── streaming-request.ts  # Type definitions for requests/responses
│   └── model-configs.ts      # Model configurations
├── dist/                     # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## Error Handling

The client provides comprehensive error handling through events:

```typescript
client.chat(messages, {
  onError: (error: Error) => {
    if (error.message.includes('401')) {
      console.error('Authentication failed. Check your API key.');
    } else if (error.message.includes('timeout')) {
      console.error('Request timed out. Please try again.');
    } else {
      console.error('Unexpected error:', error.message);
    }
  }
});
```

## License

MIT

## Contributing

Contributions are welcome! Please ensure your code:
- Follows TypeScript best practices
- Includes proper type definitions
- Maintains backward compatibility
- Includes appropriate error handling

## Support

For issues related to:
- **Salesforce APIs**: Contact your Salesforce support team
- **Library bugs**: Open an issue in the repository
- **Feature requests**: Submit a pull request or open an issue

