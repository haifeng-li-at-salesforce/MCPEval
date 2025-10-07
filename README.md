# MCPEval - Model Switching Framework

A comprehensive TypeScript framework for runtime model switching across different AI providers and APIs.

## Features

- 🔄 **Runtime Model Switching**: Switch between different AI models at runtime
- 🌐 **Multi-Provider Support**: OpenAI, Salesforce Einstein, Anthropic Claude
- ⚙️ **Configuration Management**: Centralized model and endpoint configuration
- 💰 **Cost Estimation**: Built-in cost calculation for different models
- 🎯 **Smart Model Selection**: Automatic model selection based on task type
- 📊 **Usage Tracking**: Token usage and response metadata
- 🌊 **Streaming Support**: Real-time streaming with Server-Sent Events (SSE)
- 🔄 **Retry Logic**: Automatic retry with exponential backoff
- 📈 **Progress Tracking**: Real-time progress monitoring for streaming responses

## Quick Start

### 1. Environment Setup

Create a `.env` file with your API keys:

```bash
# Salesforce API Configuration (using OPENAI prefix)
OPENAI_API_KEY=your_salesforce_api_key_here
OPENAI_TENANT_ID=your_tenant_id_here
OPENAI_BASE_URL=https://test.api.salesforce.com
OPENAI_FEATURE_ID=EinsteinForDevelopers
OPENAI_MODEL=llmgateway__OpenAIGPT5

# Anthropic Claude (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Default configurations (optional)
DEFAULT_ENDPOINT=openai
DEFAULT_MODEL=gpt-3.5-turbo
SELECTED_MODEL=gpt-4o
```

**Note:** Copy `.env.example` to `.env` and update with your actual credentials.

### 2. Basic Usage

```typescript
import { ModelManager } from './src/config';

const manager = new ModelManager();

// Switch model at runtime
manager.switchModel('gpt-4o');
manager.switchModel('claude-3-5-sonnet');
manager.switchModel('xgen_stream'); // Salesforce model
```

### 3. Advanced Usage

```typescript
import { AdvancedModelClient } from './src/advanced-example';

const client = new AdvancedModelClient();

// Universal chat method
const response = await client.chat([
  { role: 'user', content: 'Hello, world!' }
]);

// Smart model selection
await client.smartModelSelection(
  'salesforce development', 
  'Create Apex code for data validation'
);
```

## Available Models

### OpenAI Models
- `gpt-3.5-turbo` - Fast and cost-effective
- `gpt-4` - High-quality responses
- `gpt-4o` - Latest model with vision support

### Salesforce Models
- `xgen_stream` - Salesforce internal model
- `sf_gpt4o` - GPT-4o via Salesforce gateway
- `sf_claude` - Claude via Salesforce gateway

### Anthropic Models
- `claude-3-5-sonnet` - Advanced reasoning and analysis

## API Endpoints

The framework supports multiple API endpoints:

- **OpenAI**: `https://api.openai.com/v1`
- **Salesforce Einstein**: `https://api.salesforce.com/einstein/gpt/code/v1.1`
- **Anthropic**: `https://api.anthropic.com/v1`

## Examples

### Basic Model Switching

```typescript
// Switch to different models
manager.switchModel('gpt-4o');        // OpenAI GPT-4o
manager.switchModel('xgen_stream');   // Salesforce XGen
manager.switchModel('claude-3-5-sonnet'); // Anthropic Claude
```

### Cost Estimation

```typescript
// Estimate cost for 1000 input + 500 output tokens
const cost = manager.estimateCost(1000, 500);
console.log(`Estimated cost: $${cost.toFixed(4)}`);
```

### Smart Model Selection

```typescript
// Automatically select best model for task
await client.smartModelSelection(
  'salesforce development',
  'Generate Apex trigger code'
);
```

### Streaming Support

```typescript
import { OpenAIStreamingWebClient } from './src/streaming-client';

// Create streaming client
const streamingClient = new OpenAIStreamingWebClient({
  apiKey: 'your-api-key',
  tenantId: 'your-tenant-id',
  baseUrl: 'https://test.api.salesforce.com'
});

// Stream chat completion
await streamingClient.chat([
  { role: 'user', content: 'Write hello world in JavaScript' }
], {
  model: 'llmgateway__OpenAIGPT5',
  maxTokens: 2048,
  onContent: (content: string) => {
    process.stdout.write(content); // Real-time output
  },
  onEnd: () => {
    console.log('\n✅ Streaming completed!');
  }
});
```

### Enhanced Streaming with Retry Logic

```typescript
import { EnhancedStreamingClient } from './src/streaming-example';

const client = new EnhancedStreamingClient({
  apiKey: 'your-api-key',
  tenantId: 'your-tenant-id',
  maxRetries: 3,
  retryDelay: 1000
});

// Stream with progress tracking and retry logic
const response = await client.streamWithProgress([
  { role: 'user', content: 'Explain TypeScript benefits' }
], {
  model: 'llmgateway__OpenAIGPT5',
  onProgress: (progress) => {
    console.log(`Progress: ${progress.received} chunks received`);
  }
});
```

## Running the Examples

```bash
# Install dependencies
npm install

# Run basic example
npm run dev

# Run comprehensive demo
npm run demo

# Run advanced example
npm run advanced-demo

# Run Salesforce example
npm run salesforce-demo

# Run streaming client test
npm run streaming-test

# Run streaming client demo
npm run streaming-demo
```

## Configuration

### Model Configuration

Each model is configured with:
- **ID**: Unique identifier
- **Name**: Display name
- **Provider**: API provider
- **Max Tokens**: Maximum token limit
- **Capabilities**: Supported features
- **Cost**: Cost per token (if available)

### Endpoint Configuration

Each endpoint includes:
- **Base URL**: API endpoint URL
- **Auth Type**: Authentication method
- **Headers**: Required headers
- **Rate Limits**: API rate limits

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ModelManager                              │
│  - Model switching logic                                    │
│  - Configuration management                                 │
│  - Cost estimation                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                AdvancedModelClient                          │
│  - Universal chat interface                                 │
│  - Provider-specific implementations                       │
│  - Smart model selection                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Provider-Specific Clients                      │
│  - OpenAI SDK                                               │
│  - Salesforce API                                           │
│  - Anthropic SDK                                            │
└─────────────────────────────────────────────────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your model configuration
4. Test with different providers
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
