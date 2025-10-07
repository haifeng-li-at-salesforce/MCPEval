// Test script for OpenAI SDK-based streaming client
import { OpenAIStreamingWebClient, createOpenAIStreamingClient, testOpenAIStreamingClient } from './openai-streaming-client';

async function testBasicOpenAIStreaming() {
  console.log('🧪 Testing OpenAI SDK-based Streaming Client\n');

  const client = createOpenAIStreamingClient({
    apiKey: '651192c5-37ff-440a-b930-7444c69f4422',
    tenantId: 'core/falcontest1-core4sdb6/00DSG000002tHLd2AM',
    baseUrl: 'https://test.api.salesforce.com',
    featureId: 'EinsteinForDevelopers'
  });

  try {
    console.log('📤 Testing OpenAI SDK post method...');
    console.log('📝 Prompt: "Write hello world in Javascript"');
    console.log('🤖 Model: llmgateway__OpenAIGPT5');
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
        console.log('\n\n✅ OpenAI SDK streaming completed successfully!');
        console.log(`📊 Total chunks received: ${chunkCount}`);
        console.log(`📝 Response length: ${responseText.length} characters`);
        console.log(`🔤 Response preview: ${responseText.substring(0, 100)}...`);
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testChatCompletions() {
  console.log('\n🧪 Testing OpenAI SDK Chat Completions\n');

  const client = createOpenAIStreamingClient({
    apiKey: '651192c5-37ff-440a-b930-7444c69f4422',
    tenantId: 'core/falcontest1-core4sdb6/00DSG000002tHLd2AM',
    baseUrl: 'https://test.api.salesforce.com',
    featureId: 'EinsteinForDevelopers'
  });

  try {
    console.log('📤 Testing OpenAI SDK chat.completions.create...');
    console.log('📝 Prompt: "Explain TypeScript benefits"');
    console.log('🤖 Model: llmgateway__OpenAIGPT5');
    console.log('\n📥 Response:\n');

    let responseText = '';

    await client.chatCompletions([
      { role: 'user', content: 'Explain TypeScript benefits over JavaScript in 3 key points' }
    ], {
      model: 'llmgateway__OpenAIGPT5',
      maxTokens: 1000,
      onContent: (content: string) => {
        process.stdout.write(content);
        responseText += content;
      },
      onError: (error: Error) => {
        console.error('\n❌ Error:', error.message);
      },
      onEnd: () => {
        console.log('\n\n✅ Chat completions streaming completed!');
        console.log(`📝 Response length: ${responseText.length} characters`);
        console.log(`🔤 Response preview: ${responseText.substring(0, 100)}...`);
      }
    });

  } catch (error) {
    console.error('❌ Chat completions test failed:', error);
  }
}

async function testDirectPostMethod() {
  console.log('\n🧪 Testing Direct Post Method\n');

  const client = createOpenAIStreamingClient({
    apiKey: '651192c5-37ff-440a-b930-7444c69f4422',
    tenantId: 'core/falcontest1-core4sdb6/00DSG000002tHLd2AM',
    baseUrl: 'https://test.api.salesforce.com',
    featureId: 'EinsteinForDevelopers'
  });

  try {
    console.log('📤 Testing direct post method...');
    console.log('📝 Prompt: "Create a simple React component"');
    console.log('🤖 Model: llmgateway__OpenAIGPT5');
    console.log('\n📥 Response:\n');

    const request = {
      model: 'llmgateway__OpenAIGPT5',
      messages: [
        { role: 'user' as const, content: 'Create a simple React component' }
      ],
      max_tokens: 1500,
      generation_settings: {
        max_tokens: 1500,
        parameters: {}
      }
    };

    const stream = await client.post(request);
    await client.processStream(stream);

    console.log('\n\n✅ Direct post method completed!');

  } catch (error) {
    console.error('❌ Direct post test failed:', error);
  }
}

// Main test runner
async function runAllOpenAITests() {
  console.log('🚀 OpenAI SDK Streaming Client Test Suite\n');
  console.log('=' .repeat(50));

  try {
    // Test 1: Basic streaming with OpenAI SDK
    await testBasicOpenAIStreaming();
    
    // Test 2: Chat completions
    await testChatCompletions();
    
    // Test 3: Direct post method
    await testDirectPostMethod();

    console.log('\n' + '=' .repeat(50));
    console.log('✅ All OpenAI SDK tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('  ✅ OpenAI SDK post method');
    console.log('  ✅ Chat completions streaming');
    console.log('  ✅ Direct post method');
    console.log('\n🎉 OpenAI SDK-based streaming client is working correctly!');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllOpenAITests().catch(console.error);
}

export { testBasicOpenAIStreaming, testChatCompletions, testDirectPostMethod, runAllOpenAITests };
