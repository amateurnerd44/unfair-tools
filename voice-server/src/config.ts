import { z } from "zod";

const configSchema = z.object({
  port: z.coerce.number().default(3001),
  host: z.string().default("0.0.0.0"),
  publicUrl: z.string().min(1),

  twilioAccountSid: z.string().min(1),
  twilioAuthToken: z.string().min(1),
  twilioPhoneNumber: z.string().min(1),

  deepgramApiKey: z.string().min(1),
  anthropicApiKey: z.string().min(1),
  cartesiaApiKey: z.string().min(1),
  cartesiaVoiceId: z.string().default("a0e99841-438c-4a64-b679-ae501e7d6091"),

  databaseUrl: z.string().min(1),
  redisUrl: z.string().default("redis://localhost:6379"),

  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),

  deepgramModel: z.string().default("nova-2"),
  deepgramEndpointingMs: z.coerce.number().default(300),
  deepgramUtteranceEndMs: z.coerce.number().default(1000),

  anthropicModel: z.string().default("claude-sonnet-4-20250514"),
  maxConversationTokens: z.coerce.number().default(8000),

  silenceTimeoutMs: z.coerce.number().default(30000),
  maxCallDurationMs: z.coerce.number().default(1800000),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    port: process.env.VOICE_SERVER_PORT,
    host: process.env.VOICE_SERVER_HOST,
    publicUrl: process.env.VOICE_SERVER_PUBLIC_URL,

    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,

    deepgramApiKey: process.env.DEEPGRAM_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    cartesiaApiKey: process.env.CARTESIA_API_KEY,
    cartesiaVoiceId: process.env.CARTESIA_VOICE_ID,

    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,

    logLevel: process.env.LOG_LEVEL,

    deepgramModel: process.env.DEEPGRAM_MODEL,
    deepgramEndpointingMs: process.env.DEEPGRAM_ENDPOINTING_MS,
    deepgramUtteranceEndMs: process.env.DEEPGRAM_UTTERANCE_END_MS,

    anthropicModel: process.env.ANTHROPIC_MODEL,
    maxConversationTokens: process.env.MAX_CONVERSATION_TOKENS,

    silenceTimeoutMs: process.env.SILENCE_TIMEOUT_MS,
    maxCallDurationMs: process.env.MAX_CALL_DURATION_MS,
  });
}
