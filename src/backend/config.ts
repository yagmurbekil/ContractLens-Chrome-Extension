import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3001),
  LLM_PROVIDER: z.enum(['mock', 'openai', 'gemini', 'anthropic']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(30000),
  MAX_RETRIES: z.coerce.number().default(2),
  RATE_LIMIT_MAX_PER_MINUTE: z.coerce.number().default(30),
});

export type BackendConfig = z.infer<typeof EnvSchema>;

export function getBackendConfig(): BackendConfig {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.warn('[ContractLens] Invalid environment variables, falling back to safe defaults:', result.error.format());
    return EnvSchema.parse({});
  }
  return result.data;
}
