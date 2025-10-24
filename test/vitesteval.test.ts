import { describeEval } from 'vitest-evals';
import { createTaskRunner } from './utils/task-runner';



  // Another example: Evaluating Fibonacci explanations
  describeEval('Fibonacci Number Explanation', {
    data: async () => [
      { 
        input: 'What is the 5th Fibonacci number?  Return ONLY the numeric answer, nothing else.',
        expected: '5'
      },
      { 
        input: 'What is the 7th Fibonacci number? Return ONLY the numeric answer, nothing else.',
        expected: '13'
      },
      { 
        input: 'What is the 0th Fibonacci number? Return ONLY the numeric answer, nothing else.',
        expected: '0'
      },
    ],
    task: createTaskRunner(),
    scorers: [
      async ({ output, expected }) => {
        const score = output.includes(expected) ? 1.0 : 0.0;
        return { score };
      }
    ],
    threshold: 1.0, // All tests must pass
  });

