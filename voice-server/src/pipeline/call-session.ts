import { Config } from "../config";
import { TwilioMediaSession } from "../telephony/twilio-stream";
import { DeepgramSTT } from "../stt/deepgram";
import { CartesiaTTS } from "../tts/cartesia";
import { ClaudeClient, ToolUseRequest } from "../llm/claude-client";
import { ConversationManager, CallContext } from "../llm/conversation";
import { buildSystemPrompt } from "../llm/system-prompt";
import { SentenceBuffer } from "../tts/sentence-buffer";
import { BargeInDetector } from "./barge-in";
import { SilenceDetector } from "./silence-detector";
import { CallState, PipelineTimings, measureLatency } from "./pipeline-events";
import { getAllTools, executeTool, registerTransferHandler } from "../llm/tools/tool-registry";
import { callLogger } from "../utils/logger";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CallSession {
  private stt: DeepgramSTT;
  private tts: CartesiaTTS;
  private llm: ClaudeClient;
  private conversation: ConversationManager;
  private sentenceBuffer: SentenceBuffer;
  private bargeInDetector: BargeInDetector;
  private silenceDetector: SilenceDetector;
  private state: CallState = "idle";
  private currentAbort: AbortController | null = null;
  private timings: PipelineTimings = {};
  private log;
  private destroyed = false;
  private systemPrompt: string;

  constructor(
    private config: Config,
    private mediaSession: TwilioMediaSession
  ) {
    const callSid = mediaSession.callSid;
    this.log = callLogger(callSid);

    const context: CallContext = {
      callSid,
      callerNumber: mediaSession.callerNumber,
    };

    this.stt = new DeepgramSTT(config, callSid);
    this.tts = new CartesiaTTS(config, callSid);
    this.llm = new ClaudeClient(config, callSid);
    this.conversation = new ConversationManager(context);
    this.systemPrompt = buildSystemPrompt(context);

    this.sentenceBuffer = new SentenceBuffer((sentence) => {
      this.onSentenceReady(sentence);
    });

    this.bargeInDetector = new BargeInDetector(callSid);

    this.silenceDetector = new SilenceDetector(
      callSid,
      config.silenceTimeoutMs,
      config.maxCallDurationMs,
      {
        onSilenceTimeout: () => this.handleSilenceTimeout(),
        onMaxDuration: () => this.handleMaxDuration(),
      }
    );

    registerTransferHandler(async (sid, number) => {
      this.log.info({ targetNumber: number }, "transferring call");
      mediaSession.close();
    });
  }

  async start(): Promise<void> {
    this.log.info("initializing call session");

    await this.resolveCallerContext();

    await Promise.all([this.stt.connect(), this.tts.connect()]);

    this.stt.onTranscript((event) => {
      if (event.isFinal && event.text.trim()) {
        this.silenceDetector.notifySpeech();
        this.timings.sttCompletedAt = Date.now();
        this.onTranscriptFinal(event.text);
      } else if (event.text.trim()) {
        this.silenceDetector.notifySpeech();
      }
    });

    this.stt.onUtteranceEnd(() => {
      // Utterance end is a secondary signal; we primarily act on speechFinal
    });

    this.stt.onError((err) => {
      this.log.error({ error: err.message }, "STT error during call");
    });

    this.state = "listening";

    await this.speakGreeting();

    this.log.info("call session ready");
  }

  handleInboundAudio(pcm16k: Buffer): void {
    if (this.destroyed) return;

    this.timings.sttStartedAt ??= Date.now();
    this.stt.sendAudio(pcm16k);

    if (this.state === "speaking") {
      this.bargeInDetector.processAudio(pcm16k, {
        onBargeIn: () => this.handleBargeIn(),
      });
    }
  }

  private async onTranscriptFinal(text: string): Promise<void> {
    this.log.info({ text }, "caller said");
    this.conversation.addUserMessage(text);
    this.state = "processing";

    this.currentAbort?.abort();
    this.currentAbort = new AbortController();

    this.timings = { sttCompletedAt: Date.now() };
    this.timings.llmStartedAt = Date.now();
    let firstToken = true;

    try {
      const fullText = await this.llm.streamResponse({
        messages: this.conversation.getMessages(),
        tools: getAllTools(),
        systemPrompt: this.systemPrompt,
        onTextDelta: (text) => {
          if (firstToken) {
            this.timings.llmFirstTokenAt = Date.now();
            firstToken = false;
          }
          this.conversation.appendPartialAssistant(text);
          this.sentenceBuffer.addToken(text);
        },
        onToolUse: async (toolUse: ToolUseRequest) => {
          return executeTool(
            toolUse.name,
            toolUse.id,
            toolUse.input,
            this.conversation.context
          );
        },
        signal: this.currentAbort.signal,
      });

      this.sentenceBuffer.flush();
      this.timings.llmCompletedAt = Date.now();

      this.conversation.flushPartialAssistant();
      if (!fullText.trim()) {
        this.conversation.addAssistantMessage(fullText);
      }

      const latency = measureLatency(this.timings);
      this.log.info(latency, "turn latency");

      this.state = "listening";
    } catch (err) {
      if (this.currentAbort.signal.aborted) return;
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error({ error: msg }, "LLM error");
      this.state = "listening";
    }
  }

  private async onSentenceReady(sentence: string): Promise<void> {
    if (this.destroyed || this.currentAbort?.signal.aborted) return;

    this.state = "speaking";
    this.timings.ttsStartedAt ??= Date.now();
    let firstAudio = true;

    try {
      await this.tts.synthesize(sentence, (pcmChunk) => {
        if (firstAudio) {
          this.timings.ttsFirstAudioAt = Date.now();
          firstAudio = false;
        }
        this.mediaSession.sendAudio(pcmChunk);
      });
      this.timings.ttsCompletedAt = Date.now();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error({ error: msg }, "TTS error");
    }
  }

  private handleBargeIn(): void {
    this.log.info("caller interrupted — cancelling response");

    this.currentAbort?.abort();
    this.tts.cancel();
    this.sentenceBuffer.clear();
    this.mediaSession.clearAudio();

    const partial = this.conversation.getPartialText();
    if (partial.trim()) {
      this.conversation.flushPartialAssistant();
    }

    this.bargeInDetector.reset();
    this.state = "listening";
  }

  private async speakGreeting(): Promise<void> {
    const greeting =
      "Hello, thank you for calling Unfair Tools. How can I help you today?";

    this.conversation.addAssistantMessage(greeting);
    this.state = "speaking";

    await this.tts.synthesize(greeting, (pcmChunk) => {
      this.mediaSession.sendAudio(pcmChunk);
    });

    this.state = "listening";
  }

  private handleSilenceTimeout(): void {
    if (this.state === "speaking" || this.state === "processing") return;

    this.log.info("prompting after silence");
    this.conversation.addAssistantMessage(
      "Are you still there? Is there anything else I can help you with?"
    );
    this.tts
      .synthesize(
        "Are you still there? Is there anything else I can help you with?",
        (chunk) => this.mediaSession.sendAudio(chunk)
      )
      .catch(() => {});
  }

  private handleMaxDuration(): void {
    this.log.info("ending call due to max duration");
    this.tts
      .synthesize(
        "I appreciate your time, but we've reached the maximum call duration. Please call back if you need further help. Goodbye!",
        (chunk) => this.mediaSession.sendAudio(chunk)
      )
      .then(() => {
        setTimeout(() => this.destroy(), 3000);
      })
      .catch(() => this.destroy());
  }

  private async resolveCallerContext(): Promise<void> {
    try {
      const customer = await prisma.customer.findFirst({
        where: { phone: this.mediaSession.callerNumber },
        include: { salesRep: true },
      });

      if (customer) {
        this.conversation.context.callerName = customer.name;
        this.conversation.context.customerId = customer.id;
        this.conversation.context.associatedSalesRep = customer.salesRep.name;
        this.systemPrompt = buildSystemPrompt(this.conversation.context);
        this.log.info(
          { customerName: customer.name, salesRep: customer.salesRep.name },
          "resolved caller identity"
        );
      }
    } catch (err) {
      this.log.warn("could not resolve caller context from database");
    }
  }

  getTranscript(): string {
    return this.conversation.getTranscript();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.log.info("destroying call session");
    this.currentAbort?.abort();
    this.silenceDetector.destroy();
    this.stt.close();
    this.tts.close();
    this.mediaSession.close();
  }
}
