import Anthropic from "@anthropic-ai/sdk";
import { Config } from "../config";
import { callLogger } from "../utils/logger";
import { LLMError } from "../utils/errors";

export interface ToolUseRequest {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface StreamResponseOptions {
  messages: Anthropic.MessageParam[];
  tools: Anthropic.Tool[];
  systemPrompt: string;
  onTextDelta: (text: string) => void;
  onToolUse: (toolUse: ToolUseRequest) => Promise<ToolResult>;
  signal: AbortSignal;
}

export class ClaudeClient {
  private client: Anthropic;
  private log;

  constructor(
    private config: Config,
    private callSid: string
  ) {
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
    this.log = callLogger(callSid);
  }

  async streamResponse(opts: StreamResponseOptions): Promise<string> {
    const { messages, tools, systemPrompt, onTextDelta, onToolUse, signal } = opts;

    let fullText = "";
    let currentMessages = [...messages];

    while (true) {
      if (signal.aborted) break;

      let response: Anthropic.Message;
      try {
        const stream = this.client.messages.stream({
          model: this.config.anthropicModel,
          max_tokens: 1024,
          system: systemPrompt,
          messages: currentMessages,
          tools: tools.length > 0 ? tools : undefined,
        });

        signal.addEventListener("abort", () => stream.abort(), { once: true });

        stream.on("text", (text) => {
          if (!signal.aborted) {
            fullText += text;
            onTextDelta(text);
          }
        });

        response = await stream.finalMessage();
      } catch (err) {
        if (signal.aborted) break;
        const msg = err instanceof Error ? err.message : String(err);
        throw new LLMError(`Claude streaming error: ${msg}`);
      }

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ContentBlockParam & { type: "tool_use" } =>
          block.type === "tool_use"
      );

      if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
        break;
      }

      const toolResults: ToolResult[] = [];
      for (const toolBlock of toolUseBlocks) {
        if (signal.aborted) break;

        this.log.info({ tool: toolBlock.name }, "executing tool");

        const result = await onToolUse({
          id: toolBlock.id,
          name: toolBlock.name,
          input: toolBlock.input as Record<string, unknown>,
        });
        toolResults.push(result);
      }

      if (signal.aborted) break;

      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: toolResults.map((r) => ({
            type: "tool_result" as const,
            tool_use_id: r.tool_use_id,
            content: r.content,
            is_error: r.is_error,
          })),
        },
      ];
    }

    return fullText;
  }
}
