// Comprehensive example of OpenAIStreamingWebClient usage
import { OpenAIStreamingWebClient, testStreamingClient, StreamingMessage, } from './streaming-client';
import { EventResponse } from './streaming-request';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();



// Run demonstrations
// demonstrateStreamingClient();
// demonstrateStreamingModelManager();
testStreamingClient();


