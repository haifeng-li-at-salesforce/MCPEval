// Demo script to showcase model switching functionality
import { ModelManager, demonstrateModelSwitching } from './config';
import { AdvancedModelClient } from './advanced-example';

async function runDemo() {
  console.log('🚀 MCPEval Model Switching Demo\n');

  // Demo 1: Basic model switching
  console.log('=== Demo 1: Basic Model Switching ===');
  demonstrateModelSwitching();
  console.log('\n');

  // Demo 2: Advanced client with actual API calls (if API keys are available)
  if (process.env.OPENAI_API_KEY) {
    console.log('=== Demo 2: Advanced Model Client ===');
    const client = new AdvancedModelClient();
    
    try {
      // Test basic chat functionality
      console.log('Testing basic chat functionality...');
      const response = await client.chat([
        { role: 'user', content: 'Say hello and tell me which model you are.' }
      ]);
      
      console.log(`Response: ${response.content}`);
      console.log(`Model used: ${response.model}`);
      console.log(`Tokens used: ${response.usage?.total_tokens || 'N/A'}\n`);

      // Test model switching
      console.log('Testing model switching...');
      const models = ['gpt-3.5-turbo', 'gpt-4o'];
      
      for (const modelId of models) {
        if (client.switchModel(modelId)) {
          const modelResponse = await client.chat([
            { role: 'user', content: `Hello! What model are you? Please keep it short.` }
          ]);
          console.log(`${modelId}: ${modelResponse.content?.substring(0, 100)}...`);
        }
      }
      
    } catch (error) {
      console.error('Demo 2 failed:', error instanceof Error ? error.message : String(error));
    }
  } else {
    console.log('=== Demo 2: Skipped (No OpenAI API key found) ===');
    console.log('Set OPENAI_API_KEY environment variable to run this demo.\n');
  }

  // Demo 3: Smart model selection
  console.log('=== Demo 3: Smart Model Selection ===');
  const manager = new ModelManager();
  
  const tasks = [
    { type: 'general question', content: 'What is the capital of France?' },
    { type: 'salesforce development', content: 'Create Apex code for a simple trigger' },
    { type: 'complex analysis', content: 'Analyze the pros and cons of microservices architecture' }
  ];

  for (const task of tasks) {
    console.log(`\nTask: ${task.type}`);
    console.log(`Content: ${task.content}`);
    
    // Simulate smart model selection
    let selectedModel: string;
    if (task.type.includes('salesforce')) {
      selectedModel = 'xgen_stream';
    } else if (task.type.includes('analysis')) {
      selectedModel = 'claude-3-5-sonnet';
    } else {
      selectedModel = 'gpt-3.5-turbo';
    }
    
    if (manager.switchModel(selectedModel)) {
      const config = manager.getCurrentConfig();
      console.log(`Selected model: ${config.model.name} (${config.model.provider})`);
      console.log(`Max tokens: ${config.model.maxTokens}`);
      console.log(`Capabilities: ${config.model.capabilities.join(', ')}`);
    }
  }

  // Demo 4: Cost comparison
  console.log('\n=== Demo 4: Cost Comparison ===');
  const models = ['gpt-3.5-turbo', 'gpt-4o', 'claude-3-5-sonnet'];
  const inputTokens = 1000;
  const outputTokens = 500;
  
  console.log(`Cost for ${inputTokens} input + ${outputTokens} output tokens:\n`);
  
  for (const modelId of models) {
    if (manager.switchModel(modelId)) {
      const cost = manager.estimateCost(inputTokens, outputTokens);
      const config = manager.getCurrentConfig();
      console.log(`${config.model.name}: $${cost.toFixed(4)}`);
    }
  }

  console.log('\n✅ Demo completed successfully!');
  console.log('\nTo run with actual API calls:');
  console.log('1. Set your API keys in .env file');
  console.log('2. Run: npm run dev');
  console.log('3. Or run: npx ts-node src/demo.ts');
}

// Run the demo
runDemo().catch(console.error);
