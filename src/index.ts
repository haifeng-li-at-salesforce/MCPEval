import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this environment variable
});

// Configuration for different models
const MODEL_CONFIG: Record<string, { name: string; maxTokens: number }> = {
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', maxTokens: 4096 },
  'gpt-4': { name: 'GPT-4', maxTokens: 8192 },
  'gpt-4-turbo': { name: 'GPT-4 Turbo', maxTokens: 128000 },
  'gpt-4o': { name: 'GPT-4o', maxTokens: 128000 },
  'gpt-4o-mini': { name: 'GPT-4o Mini', maxTokens: 128000 }
};

// Function to get model from environment or default
function getSelectedModel(): string {
  return process.env.SELECTED_MODEL || 'gpt-3.5-turbo';
}

// Function to switch model at runtime
function switchModel(newModel: string): string {
  if (MODEL_CONFIG[newModel]) {
    process.env.SELECTED_MODEL = newModel;
    console.log(`Switched to model: ${MODEL_CONFIG[newModel].name}`);
    return newModel;
  } else {
    console.warn(`Model ${newModel} not found. Available models:`, Object.keys(MODEL_CONFIG));
    return getSelectedModel();
  }
}

async function main() {
  try {
    console.log('OpenAI SDK initialized successfully!');
    
   
    // Get current model
    const currentModel = getSelectedModel();
    console.log(`Using model: ${MODEL_CONFIG[currentModel]?.name || currentModel}`);
    
    // Example: Simple chat completion with configurable model
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello, world!' }],
      model: currentModel,
      max_tokens: MODEL_CONFIG[currentModel]?.maxTokens || 1000,
    });
    
    console.log('Chat completion response:', completion.choices[0]?.message?.content);
    
    // Example: Switch model at runtime
    console.log('\n--- Switching model at runtime ---');
    const newModel = switchModel('gpt-4');
    
    const completion2 = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'What is the capital of France?' }],
      model: newModel,
      max_tokens: MODEL_CONFIG[newModel]?.maxTokens || 1000,
    });
    
    console.log('New model response:', completion2.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();
