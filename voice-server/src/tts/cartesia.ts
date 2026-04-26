import WebSocket from "ws";
import { Config } from "../config";
import { callLogger } from "../utils/logger";
import { TTSProvider } from "./tts-provider";
import { TTSError } from "../utils/errors";

interface CartesiaMessage {
  type: string;
  data?: string;
  step_time?: number;
  done?: boolean;
  status_code?: number;
  message?: string;
  context_id?: string;
}

export class CartesiaTTS implements TTSProvider {
  private ws: WebSocket | null = null;
  private currentContextId: string | null = null;
  private currentResolve: (() => void) | null = null;
  private currentOnChunk: ((chunk: Buffer) => void) | null = null;
  private cancelled = false;
  private log;

  constructor(
    private config: Config,
    private callSid: string
  ) {
    this.log = callLogger(callSid);
  }

  async connect(): Promise<void> {
    const url = `wss://api.cartesia.ai/tts/websocket?api_key=${this.config.cartesiaApiKey}&cartesia_version=2024-06-10`;

    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.on("open", () => {
        this.log.info("cartesia connection opened");
        resolve();
      });

      this.ws.on("error", (err) => {
        this.log.error({ error: err.message }, "cartesia error");
        reject(new TTSError(`Cartesia connection error: ${err.message}`));
      });

      this.ws.on("message", (data: WebSocket.RawData) => {
        let msg: CartesiaMessage;
        try {
          msg = JSON.parse(data.toString());
        } catch {
          return;
        }

        if (msg.context_id && msg.context_id !== this.currentContextId) return;

        if (msg.type === "chunk" && msg.data && !this.cancelled) {
          const pcm = Buffer.from(msg.data, "base64");
          this.currentOnChunk?.(pcm);
        }

        if (msg.type === "done" || msg.done) {
          this.currentResolve?.();
          this.currentResolve = null;
          this.currentOnChunk = null;
        }

        if (msg.type === "error") {
          this.log.error({ message: msg.message }, "cartesia synthesis error");
          this.currentResolve?.();
          this.currentResolve = null;
        }
      });

      this.ws.on("close", () => {
        this.log.info("cartesia connection closed");
      });
    });
  }

  async synthesize(
    text: string,
    onAudioChunk: (pcmChunk: Buffer) => void
  ): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new TTSError("Cartesia WebSocket not connected");
    }

    this.cancelled = false;
    this.currentContextId = crypto.randomUUID();
    this.currentOnChunk = onAudioChunk;

    return new Promise<void>((resolve) => {
      this.currentResolve = resolve;

      this.ws!.send(
        JSON.stringify({
          model_id: "sonic-english",
          transcript: text,
          voice: {
            mode: "id",
            id: this.config.cartesiaVoiceId,
          },
          output_format: {
            container: "raw",
            encoding: "pcm_s16le",
            sample_rate: 24000,
          },
          context_id: this.currentContextId,
          language: "en",
        })
      );
    });
  }

  cancel(): void {
    this.cancelled = true;

    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentContextId) {
      this.ws.send(
        JSON.stringify({
          cancel: true,
          context_id: this.currentContextId,
        })
      );
    }

    this.currentResolve?.();
    this.currentResolve = null;
    this.currentOnChunk = null;
    this.currentContextId = null;
  }

  close(): void {
    this.cancel();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
