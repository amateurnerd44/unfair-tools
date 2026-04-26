import {
  createClient,
  DeepgramClient,
  LiveTranscriptionEvents,
  type ListenLiveClient,
} from "@deepgram/sdk";
import { Config } from "../config";
import { callLogger } from "../utils/logger";
import { STTProvider, TranscriptEvent } from "./stt-provider";
import { STTError } from "../utils/errors";

export class DeepgramSTT implements STTProvider {
  private client: DeepgramClient;
  private connection: ListenLiveClient | null = null;
  private transcriptCallback: ((event: TranscriptEvent) => void) | null = null;
  private utteranceEndCallback: (() => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private log;

  constructor(
    private config: Config,
    private callSid: string
  ) {
    this.client = createClient(config.deepgramApiKey);
    this.log = callLogger(callSid);
  }

  async connect(): Promise<void> {
    this.connection = this.client.listen.live({
      model: this.config.deepgramModel,
      language: "en-US",
      smart_format: true,
      punctuate: true,
      interim_results: true,
      utterance_end_ms: this.config.deepgramUtteranceEndMs,
      endpointing: this.config.deepgramEndpointingMs,
      encoding: "linear16",
      sample_rate: 16000,
      channels: 1,
      vad_events: true,
    });

    return new Promise<void>((resolve, reject) => {
      const conn = this.connection!;

      conn.on(LiveTranscriptionEvents.Open, () => {
        this.log.info("deepgram connection opened");
        resolve();
      });

      conn.on(LiveTranscriptionEvents.Error, (err) => {
        const error = new STTError(`Deepgram error: ${err.message}`);
        this.log.error({ error: err.message }, "deepgram error");
        this.errorCallback?.(error);
        reject(error);
      });

      conn.on(LiveTranscriptionEvents.Transcript, (data) => {
        const alt = data.channel?.alternatives?.[0];
        if (!alt) return;

        const event: TranscriptEvent = {
          text: alt.transcript || "",
          isFinal: data.is_final ?? false,
          confidence: alt.confidence ?? 0,
          speechFinal: data.speech_final ?? false,
        };

        if (event.text) {
          this.log.debug(
            { text: event.text, isFinal: event.isFinal, speechFinal: event.speechFinal },
            "transcript"
          );
          this.transcriptCallback?.(event);
        }
      });

      conn.on(LiveTranscriptionEvents.UtteranceEnd, () => {
        this.log.debug("utterance end detected");
        this.utteranceEndCallback?.();
      });

      conn.on(LiveTranscriptionEvents.Close, () => {
        this.log.info("deepgram connection closed");
      });
    });
  }

  sendAudio(pcm16k: Buffer): void {
    if (this.connection) {
      this.connection.send(pcm16k);
    }
  }

  onTranscript(callback: (event: TranscriptEvent) => void): void {
    this.transcriptCallback = callback;
  }

  onUtteranceEnd(callback: () => void): void {
    this.utteranceEndCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  close(): void {
    if (this.connection) {
      this.connection.requestClose();
      this.connection = null;
    }
  }
}
