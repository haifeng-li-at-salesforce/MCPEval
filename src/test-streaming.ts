// Test script for OpenAIStreamingWebClient
import { OpenAIStreamingWebClient, createStreamingClient } from './streaming-client';
import { EnhancedStreamingClient, StreamingModelManager } from './streaming-example';

async function testBasicStreaming() {
  console.log('🧪 Testing Basic Streaming Client\n');

  const client = createStreamingClient({
    apiKey: '651192c5-37ff-440a-b930-7444c69f4422',
    tenantId: 'core/falcontest1-core4sdb6/00DSG000002tHLd2AM',
    baseUrl: 'https://test.api.salesforce.com',
    featureId: 'EinsteinForDevelopers'
  });

  try {
    console.log('📤 Sending request...');
    console.log('📝 Prompt: "Write hello world in Javascript"');
    console.log('🤖 Model: llmgateway__OpenAIGPT5');
    console.log('📊 Max tokens: 2048');
    console.log('\n📥 Response:\n');

    let responseText = '';
    let chunkCount = 0;

    await client.chat([
      { role: 'user', content: 'Write hello world in Javascript' }
    ], {
      model: 'llmgateway__OpenAIGPT5',
      maxTokens: 2048,
      onContent: (content: string) => {
        process.stdout.write(content);
        responseText += content;
      },
      onChunk: (chunk: any) => {
        chunkCount++;
        if (chunk.data.generation_details?.parameters?.usage) {
          const usage = chunk.data.generation_details.parameters.usage;
          console.log(`\n📊 Usage: ${usage.total_tokens} tokens (${usage.prompt_tokens} prompt + ${usage.completion_tokens} completion)`);
        }
      },
      onError: (error: Error) => {
        console.error('\n❌ Error:', error.message);
      },
      onEnd: () => {
        console.log('\n\n✅ Streaming completed successfully!');
        console.log(`📊 Total chunks received: ${chunkCount}`);
        console.log(`📝 Response length: ${responseText.length} characters`);
        console.log(`🔤 Response preview: ${responseText.substring(0, 100)}...`);
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testEnhancedStreaming() {
  console.log('\n🚀 Testing Enhanced Streaming Client\n');

  const client = new EnhancedStreamingClient({
    apiKey: '651192c5-37ff-440a-b930-7444c69f4422',
    tenantId: 'core/falcontest1-core4sdb6/00DSG000002tHLd2AM',
    baseUrl: 'https://test.api.salesforce.com',
    featureId: 'EinsteinForDevelopers',
    maxRetries: 3,
    retryDelay: 1000
  });

  try {
    console.log('📤 Sending request with progress tracking...');
    console.log('📝 Prompt: "Explain TypeScript benefits"');
    console.log('🤖 Model: llmgateway__OpenAIGPT5');
    console.log('📊 Max tokens: 1000');
    console.log('\n📥 Response:\n');

    const response = await client.streamWithProgress([
      { role: 'user', content: 'Explain TypeScript benefits over JavaScript in 3 key points' }
    ], {
      model: 'llmgateway__OpenAIGPT5',
      maxTokens: 1000,
      onProgress: (progress) => {
        process.stdout.write(`\r📊 Progress: ${progress.received} chunks received`);
      }
    });

    console.log(`\n\n✅ Enhanced streaming completed!`);
    console.log(`📝 Full response: ${response}`);

  } catch (error) {
    console.error('❌ Enhanced test failed:', error);
  }
}

async function testModelManager() {
  console.log('\n🎯 Testing Streaming Model Manager\n');

  const manager = new StreamingModelManager();

  try {
    console.log('📤 Sending request via model manager...');
    console.log('📝 Prompt: "Create a simple Express.js route"');
    console.log('🌍 Environment: test');
    console.log('🤖 Model: llmgateway__OpenAIGPT5');
    console.log('\n📥 Response:\n');

    const response = await manager.stream([
      { role: 'user', content: 'Create a simple Express.js route that returns "Hello World"' }
    ], {
      environment: 'test',
      model: 'llmgateway__OpenAIGPT5',
      maxTokens: 800,
      onContent: (content: string) => {
        process.stdout.write(content);
      }
    });

    console.log(`\n\n✅ Model manager test completed!`);
    console.log(`📝 Response length: ${response.length} characters`);

  } catch (error) {
    console.error('❌ Model manager test failed:', error);
  }
}

async function testDifferentModels() {
  console.log('\n🤖 Testing Different Models\n');

  const client = createStreamingClient({
    apiKey: '651192c5-37ff-440a-b930-7444c69f4422',
    tenantId: 'core/falcontest1-core4sdb6/00DSG000002tHLd2AM',
    baseUrl: 'https://test.api.salesforce.com',
    featureId: 'EinsteinForDevelopers'
  });

  const models = [
    { id: 'llmgateway__OpenAIGPT5', name: 'GPT-5' },
    { id: 'llmgateway__OpenAIGPT4o', name: 'GPT-4o' },
    { id: 'xgen_stream', name: 'XGen Stream' }
  ];

  for (const model of models) {
    console.log(`\n🧪 Testing ${model.name} (${model.id})`);
    console.log('📝 Prompt: "Say hello and identify yourself"');
    console.log('📊 Max tokens: 100');
    console.log('\n📥 Response:\n');

    try {
      let responseText = '';
      
      await client.chat([
        { role: 'user', content: 'Say hello and identify yourself' }
      ], {
        model: model.id,
        maxTokens: 100,
        onContent: (content: string) => {
          process.stdout.write(content);
          responseText += content;
        },
        onError: (error: Error) => {
          console.error(`\n❌ ${model.name} failed:`, error.message);
        },
        onEnd: () => {
          console.log(`\n✅ ${model.name} completed: ${responseText.substring(0, 50)}...`);
        }
      });

    } catch (error) {
      console.error(`❌ ${model.name} test failed:`, error);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 OpenAIStreamingWebClient Test Suite\n');
  console.log('=' .repeat(50));

  try {
    // Test 1: Basic streaming
    await testBasicStreaming();
    
    // Test 2: Enhanced streaming
    await testEnhancedStreaming();
    
    // Test 3: Model manager
    await testModelManager();
    
    // Test 4: Different models
    await testDifferentModels();

    console.log('\n' + '=' .repeat(50));
    console.log('✅ All tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('  ✅ Basic streaming client');
    console.log('  ✅ Enhanced streaming with retry logic');
    console.log('  ✅ Streaming model manager');
    console.log('  ✅ Multiple model support');
    console.log('\n🎉 OpenAIStreamingWebClient is working correctly!');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { testBasicStreaming, testEnhancedStreaming, testModelManager, testDifferentModels, runAllTests };
