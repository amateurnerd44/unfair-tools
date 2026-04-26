import Anthropic from "@anthropic-ai/sdk";
import { saveCallRecord, CallRecord } from "./call-logger";
import { callLogger } from "../utils/logger";
import { Config } from "../config";

export async function processPostCall(
  config: Config,
  record: Omit<CallRecord, "summary">
): Promise<void> {
  const log = callLogger(record.callSid);
  log.info("starting post-call processing");

  let summary: string | undefined;

  try {
    const client = new Anthropic({ apiKey: config.anthropicApiKey });

    const response = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 256,
      system:
        "Summarize this phone call transcript in 2-3 sentences. Focus on what the caller needed and what actions were taken. Be concise.",
      messages: [{ role: "user", content: record.transcript }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    summary = textBlock ? (textBlock as { text: string }).text : undefined;
    log.info({ summary }, "call summary generated");
  } catch (err) {
    log.warn("failed to generate call summary, saving without it");
  }

  await saveCallRecord({ ...record, summary });
}
