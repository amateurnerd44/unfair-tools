import Anthropic from "@anthropic-ai/sdk";

export interface CallContext {
  callSid: string;
  callerNumber: string;
  callerName?: string;
  associatedSalesRep?: string;
  customerId?: string;
}

export class ConversationManager {
  private messages: Anthropic.MessageParam[] = [];
  private partialAssistantText = "";

  constructor(public readonly context: CallContext) {}

  addUserMessage(text: string): void {
    this.flushPartialAssistant();
    this.messages.push({ role: "user", content: text });
  }

  addAssistantMessage(text: string): void {
    this.partialAssistantText = "";
    this.messages.push({ role: "assistant", content: text });
  }

  addAssistantToolUse(content: Anthropic.ContentBlock[]): void {
    this.partialAssistantText = "";
    this.messages.push({ role: "assistant", content });
  }

  addToolResults(
    results: Array<{
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    }>
  ): void {
    this.messages.push({
      role: "user",
      content: results.map((r) => ({
        type: "tool_result" as const,
        tool_use_id: r.tool_use_id,
        content: r.content,
        is_error: r.is_error,
      })),
    });
  }

  appendPartialAssistant(text: string): void {
    this.partialAssistantText += text;
  }

  flushPartialAssistant(): void {
    if (this.partialAssistantText.trim()) {
      this.messages.push({
        role: "assistant",
        content: this.partialAssistantText,
      });
    }
    this.partialAssistantText = "";
  }

  getPartialText(): string {
    return this.partialAssistantText;
  }

  getMessages(): Anthropic.MessageParam[] {
    return [...this.messages];
  }

  getTranscript(): string {
    return this.messages
      .map((m) => {
        const role = m.role === "user" ? "Caller" : "Assistant";
        const text =
          typeof m.content === "string"
            ? m.content
            : m.content
                .filter((b) => b.type === "text")
                .map((b) => (b as { text: string }).text)
                .join(" ");
        return text ? `${role}: ${text}` : null;
      })
      .filter(Boolean)
      .join("\n");
  }

  estimateTokens(): number {
    const text = JSON.stringify(this.messages);
    return Math.ceil(text.length / 4);
  }

  trimIfNeeded(maxTokens: number): void {
    while (this.estimateTokens() > maxTokens && this.messages.length > 4) {
      this.messages.splice(0, 2);
    }
  }
}
