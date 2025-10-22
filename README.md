# MCPEval - Salesforce AI Client Library

A comprehensive TypeScript client library for interacting with Salesforce AI APIs, supporting both streaming and chat completion endpoints. Provides unified access to Einstein Dev models, LLM Express Gateway (Gemini, Claude), and more. Built with type safety and developer experience in mind.

## Features

- 🚀 **Streaming Support**: Real-time streaming of AI responses using SSE
- 🔄 **Event-Based Architecture**: Built on Node.js EventEmitter for flexible event handling
- 🎯 **Multiple Model Support**: Easy switching between different AI models (OpenAI GPT-5, Qwen, Gemini, Claude, etc.)
- 🌐 **LLM Express Gateway**: Support for multiple LLM providers through LLM Express Gateway
- 🔧 **Configurable**: Flexible configuration system with environment variable support
- 📦 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🛡️ **Error Handling**: Robust error handling and event-based error reporting
- ✅ **Testing**: Comprehensive Vitest test suite for all supported models

## Installation

```bash
npm install
```

### Dependencies

**Production:**

- `openai`: ^4.28.0 - OpenAI SDK for API client
- `dotenv`: ^17.2.3 - Environment variable management
- `@anthropic-ai/sdk`: ^0.24.3 - Anthropic SDK

**Development:**

- `typescript`: ^5.3.0 - TypeScript compiler
- `vitest`: ^3.2.4 - Testing framework
- `@vitest/ui`: ^3.2.4 - Vitest UI for interactive testing
- `ts-node`: ^10.9.0 - TypeScript execution environment

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# OpenAI GPT-5 Configuration (Einstein Dev Models)
OPENAI_API_KEY=your_api_key_here
OPENAI_TENANT_ID=your_tenant_id_here
OPENAI_FEATURE_ID=EinsteinForDevelopers
OPENAI_BASE_URL=https://test.api.salesforce.com/einstein/gpt/code/v1.1

# Xgen/Qwen Configuration (Einstein Dev Models)
XGEN_API_KEY=your_xgen_api_key_here
XGEN_TENANT_ID=your_xgen_tenant_id_here
XGEN_FEATURE_ID=EinsteinForDevelopers
XGEN_BASE_URL=https://test.api.salesforce.com/einstein/gpt/code/v1.1

# LLM Express Gateway Configuration (Gemini, Claude, etc.)
LLM_EXPRESS_GATEWAY_BASE_URL=your_llm_express_base_url
LLM_EXPRESS_GATEWAY_API_KEY=your_llm_express_api_key
```

### Model Configuration

The library supports two types of model clients:

#### 1. Einstein Dev Models (Streaming)

Available models defined in `EinsteinDevModel` enum:

- `GPT5` - OpenAI GPT-5
- `XGEN` - Qwen/Xgen model

```typescript
import { EinsteinDevModelClient } from './clients/streaming-client';
import { EinsteinDevModel } from './model/model-configs';

// Use GPT-5
const gpt5Client = new EinsteinDevModelClient(EinsteinDevModel.GPT5);
const response = await gpt5Client.chat(
  'You are a helpful assistant.',
  'What is the capital of France?'
);

// Use XGEN
const xgenClient = new EinsteinDevModelClient(EinsteinDevModel.XGEN);
```

#### 2. LLM Express Models (Chat Completion)

Available models defined in `LLMExpressModel` enum:

- `GEMINI_2_5_PRO` - Google Gemini 2.5 Pro
- `GEMINI_2_5_FLASH` - Google Gemini 2.5 Flash
- `CLAUDE_3_7_SONNET` - Anthropic Claude 3.7 Sonnet
- `CLAUDE_4_SONNET` - Anthropic Claude 4 Sonnet

```typescript
import { LLMExpressModelClient } from './clients/chatcompletion-client';
import { LLMExpressModel } from './model/model-configs';

// Use Gemini 2.5 Flash
const geminiClient = new LLMExpressModelClient(LLMExpressModel.GEMINI_2_5_FLASH);
const response = await geminiClient.chat(
  'You are a helpful assistant.',
  'What is the capital of France?'
);

// Use Claude 4 Sonnet
const claudeClient = new LLMExpressModelClient(LLMExpressModel.CLAUDE_4_SONNET);
```

#### Custom Configurations (Advanced)

You can also create custom configurations for Einstein Dev Models:

```typescript
import { ModelConfiguration } from './model/model-configs';

const customConfig: ModelConfiguration = {
  model: 'your_model_name',
  apiKey: 'your_api_key',
  tenantId: 'your_tenant_id',
  featureId: 'your_feature_id',
  baseUrl: 'https://api.salesforce.com/endpoint',
  maxTokens: 2048,
  modelProvider: 'ProviderName', // Optional
  parameters: {
    /* custom parameters */
  }, // Optional
};
```

## Usage

### Choosing the Right Client

- **EinsteinDevModelClient**: Use for Einstein Dev models (GPT5, XGEN) with streaming support
- **LLMExpressModelClient**: Use for LLM Express Gateway models (Gemini, Claude) with chat completion API

### Basic Example - Einstein Dev Models (Streaming)

```typescript
import { EinsteinDevModelClient } from './clients/streaming-client';
import { EinsteinDevModel } from './model/model-configs';

const client = new EinsteinDevModelClient(EinsteinDevModel.GPT5);

const result = await client.chat(
  'You are a helpful assistant.',
  'Write a Fibonacci function in TypeScript'
);

if (result.error) {
  console.error('Error:', result.error.message);
} else {
  console.log('Response:', result.response);
}
```

### Basic Example - LLM Express Models (Chat Completion)

```typescript
import { LLMExpressModelClient } from './clients/chatcompletion-client';
import { LLMExpressModel } from './model/model-configs';

const client = new LLMExpressModelClient(LLMExpressModel.GEMINI_2_5_FLASH);

const result = await client.chat(
  'You are a helpful assistant.',
  'Write a Fibonacci function in TypeScript'
);

if (result.error) {
  console.error('Error:', result.error.message);
} else {
  console.log('Response:', result.response);
}
```

### Advanced Streaming Example

```typescript
import { OpenAIStreamingClient } from './clients/streaming-client';
import { OPENAI_GPT5_CONFIG } from './model/model-configs';

const client = new OpenAIStreamingClient(OPENAI_GPT5_CONFIG);

await client.chat([{ role: 'user', content: 'Write a Fibonacci function in TypeScript' }], {
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
  },
});
```

### Advanced Example with Event Handlers

```typescript
import { OpenAIStreamingWebClient } from './model/streaming-client';
import { QWEN_CONFIG } from './model/model-configs';
import { EventResponse } from './model/streaming-request';

const client = new OpenAIStreamingWebClient(QWEN_CONFIG);

let fullResponse = '';
let chunkCount = 0;

await client.chat(
  [
    { role: 'system', content: 'You are a helpful coding assistant.' },
    { role: 'user', content: 'Explain async/await in JavaScript' },
  ],
  {
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
      console.log(
        `Chunk ${chunkCount}: ${chunk.data.generation_details.generations.length} generations`
      );
    },

    // Handle errors
    onError: (error: Error) => {
      console.error('Stream error:', error);
    },

    // Handle completion
    onEnd: () => {
      console.log(`\n\nCompleted! Received ${chunkCount} chunks`);
      console.log(`Total response length: ${fullResponse.length} characters`);
    },
  }
);
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
await client.chat([{ role: 'user', content: 'Hello!' }]);
```

## API Reference

### EinsteinDevModelClient

High-level client for Einstein Dev models with streaming support.

#### Constructor

```typescript
constructor(model: EinsteinDevModel)
```

**Parameters:**

- `model`: Einstein Dev model enum value (GPT5 or XGEN)

#### Methods

##### `chat(systemPrompt, userPrompt)`

Send a chat request and receive a complete response.

```typescript
async chat(systemPrompt: string, userPrompt: string): Promise<Response>
```

**Parameters:**

- `systemPrompt`: System message to set the context
- `userPrompt`: User's question or prompt

**Returns:**

```typescript
interface Response {
  error: Error | null;
  response: string | null;
}
```

### LLMExpressModelClient

Client for LLM Express Gateway supporting multiple model providers (Gemini, Claude, etc.).

#### Constructor

```typescript
constructor(model: LLMExpressModel)
```

**Parameters:**

- `model`: LLM Express model enum value (GEMINI_2_5_PRO, GEMINI_2_5_FLASH, CLAUDE_3_7_SONNET, or CLAUDE_4_SONNET)

#### Methods

##### `chat(systemPrompt, userPrompt)`

Send a chat completion request and receive a response.

```typescript
async chat(systemPrompt: string, userPrompt: string): Promise<Response>
```

**Parameters:**

- `systemPrompt`: System message to set the context
- `userPrompt`: User's question or prompt

**Returns:**

```typescript
interface Response {
  error: Error | null;
  response: string | null;
}
```

### OpenAIStreamingClient (Low-Level)

The low-level streaming client class for custom streaming implementations.

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
    maxTokens?: number; // Default: 2048
    temperature?: number; // Optional
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
  client.on('content', (content: string) => {
    /* ... */
  });
  ```

- `chunk`: Emitted for each raw chunk with full metadata

  ```typescript
  client.on('chunk', (chunk: EventResponse) => {
    /* ... */
  });
  ```

- `error`: Emitted when an error occurs

  ```typescript
  client.on('error', (error: Error) => {
    /* ... */
  });
  ```

- `end`: Emitted when streaming completes
  ```typescript
  client.on('end', () => {
    /* ... */
  });
  ```

### Types

#### Response

Common response interface for both client types:

```typescript
interface Response {
  error: Error | null; // Error object if request failed, null otherwise
  response: string | null; // Response text if successful, null otherwise
}
```

#### Model Enums

**EinsteinDevModel**

```typescript
enum EinsteinDevModel {
  GPT5 = 'GPT5',
  XGEN = 'XGEN',
}
```

**LLMExpressModel**

```typescript
enum LLMExpressModel {
  GEMINI_2_5_PRO = 'gemini-2.5-pro',
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  CLAUDE_3_7_SONNET = 'claude-3.7-sonnet-20250219',
  CLAUDE_4_SONNET = 'claude-4-sonnet-20250514',
}
```

#### ModelConfiguration

```typescript
interface ModelConfiguration {
  model: string; // Model identifier
  apiKey: string; // API authentication key
  tenantId: string; // Salesforce tenant ID
  featureId: string; // Feature identifier
  baseUrl: string; // API base URL
  maxTokens: number; // Maximum tokens to generate
  modelProvider?: string; // Optional model provider
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

The project includes a comprehensive Vitest test suite that validates all supported models.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with interactive UI
npm run test:ui
```

### Test Coverage

The test suite (`test/model-client.test.ts`) includes:

- **EinsteinDevModel Tests**: Validates GPT5 and XGEN models
- **LLMExpressModel Tests**: Validates Gemini 2.5 Pro, Gemini 2.5 Flash, Claude 3.7 Sonnet, and Claude 4 Sonnet

Each test:

- Asks "What is the capital of France?"
- Validates that the response contains "Paris"
- Checks for proper error handling
- Has a 60-second timeout for API calls

### Manual Testing

You can also run manual tests using the included helper functions:

```typescript
import { testStreamingClient } from './clients/streaming-client';
import { testLLMExpressModelClient } from './clients/chatcompletion-client';
import { OPENAI_GPT5_CONFIG } from './model/model-configs';
import { LLMExpressModel } from './model/model-configs';

// Test Einstein Dev model (streaming)
await testStreamingClient(OPENAI_GPT5_CONFIG);

// Test LLM Express model
await testLLMExpressModelClient(LLMExpressModel.GEMINI_2_5_FLASH);
```

## Build and Development

```bash
# Build TypeScript to JavaScript
npm run build

# Run in development mode
npm run dev

# Watch mode for development
npm run watch

# Run tests
npm test              # Run tests once
npm run test:watch    # Run in watch mode
npm run test:ui       # Run with UI

# Clean build artifacts
npm run clean
```

## Project Structure

```
MCPEval/
├── src/
│   ├── clients/
│   │   ├── streaming-client.ts        # EinsteinDevModelClient & OpenAIStreamingClient
│   │   ├── chatcompletion-client.ts   # LLMExpressModelClient
│   │   ├── model-client.ts            # Base ModelClient interface
│   │   ├── streaming-request.ts       # Request/response types for streaming
│   │   └── streaming-response.ts      # Response interface
│   ├── model/
│   │   └── model-configs.ts           # Model configurations and enums
│   ├── utils/
│   │   └── ai-client.ts               # Utility functions
│   └── index.ts                       # Main entry point
├── test/
│   └── model-client.test.ts           # Vitest test suite
├── dist/                              # Compiled JavaScript output
├── vitest.config.ts                   # Vitest configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Error Handling

### High-Level Clients (EinsteinDevModelClient, LLMExpressModelClient)

Both high-level clients return a `Response` object with error handling:

```typescript
const client = new LLMExpressModelClient(LLMExpressModel.GEMINI_2_5_FLASH);
const result = await client.chat('You are a helpful assistant.', 'What is the capital of France?');

if (result.error) {
  if (result.error.message.includes('401')) {
    console.error('Authentication failed. Check your API key.');
  } else if (result.error.message.includes('timeout')) {
    console.error('Request timed out. Please try again.');
  } else {
    console.error('Unexpected error:', result.error.message);
  }
} else {
  console.log('Success:', result.response);
}
```

### Low-Level Streaming Client

The streaming client provides error handling through events:

```typescript
const client = new OpenAIStreamingClient(config);

client.chat(messages, {
  onError: (error: Error) => {
    if (error.message.includes('401')) {
      console.error('Authentication failed. Check your API key.');
    } else if (error.message.includes('timeout')) {
      console.error('Request timed out. Please try again.');
    } else {
      console.error('Unexpected error:', error.message);
    }
  },
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
