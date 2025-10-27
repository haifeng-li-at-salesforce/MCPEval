import { z } from 'zod';

// Zod Schemas
export const ModelMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export const GenerationSettingsSchema = z.object({
  max_tokens: z.number(),
  parameters: z.record(z.string(), z.any()),
});

export const RequestBodySchema = z.object({
  model: z.string(),
  messages: z.array(ModelMessageSchema),
  max_tokens: z.number().optional(),
  generation_settings: GenerationSettingsSchema.optional(),
  temperature: z.number().optional(),
  stream: z.boolean().optional(),
});

export const ToolInvocationSchema = z.object({
  id: z.string(),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
});

export const DoneResponseSchema = z.object({
  event: z.literal('generation'),
  data: z.tuple([z.literal('DONE')]),
});

export const GenerationSchema = ModelMessageSchema.extend({
  id: z.string(),
  contents: z.null(),
  timestamp: z.number().nullable(),
  log_probability_result: z.null(),
  parameters: z.object({
    finish_reason: z.string().nullable().optional(),
    index: z.number().optional(),
    logprobs: z.number().nullable().optional(),
    token_log_prob: z.number().optional(),
    token_id: z.number().optional(),
  }).nullable(),
  generation_safety_score: z.number().nullable(),
  generation_content_quality: z.number().nullable(),
  tool_invocations: z.array(ToolInvocationSchema).nullable(),
  web_search_result: z.null(),
}).passthrough();

export const EventResponseSchema = z.object({
  event: z.literal('generation'),
  data: z.object({
    id: z.string(),
    generation_details: z.object({
      generations: z.array(GenerationSchema),
      parameters: z.object({
        provider: z.string(),
        created: z.number(),
        model: z.string(),
        system_fingerprint: z.string(),
        object: z.string(),
        usage: z.object({}).nullable(),
      }),
      other_details: z.null(),
    }),
  }),
});

// Export inferred TypeScript types from Zod schemas
export type ModelMessage = z.infer<typeof ModelMessageSchema>;
export type RequestBody = z.infer<typeof RequestBodySchema>;
export type ToolInvocation = z.infer<typeof ToolInvocationSchema>;
export type DoneResponse = z.infer<typeof DoneResponseSchema>;
export type EventResponse = z.infer<typeof EventResponseSchema>;
export type Generation = z.infer<typeof GenerationSchema>;
