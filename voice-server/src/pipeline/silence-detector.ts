import { callLogger } from "../utils/logger";

export interface SilenceCallbacks {
  onSilenceTimeout: () => void;
  onMaxDuration: () => void;
}

export class SilenceDetector {
  private lastSpeechAt: number;
  private callStartedAt: number;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private durationTimer: ReturnType<typeof setTimeout> | null = null;
  private log;

  constructor(
    callSid: string,
    private silenceTimeoutMs: number,
    private maxCallDurationMs: number,
    private callbacks: SilenceCallbacks
  ) {
    this.log = callLogger(callSid);
    this.lastSpeechAt = Date.now();
    this.callStartedAt = Date.now();
    this.startTimers();
  }

  notifySpeech(): void {
    this.lastSpeechAt = Date.now();
    this.resetSilenceTimer();
  }

  private startTimers(): void {
    this.resetSilenceTimer();

    this.durationTimer = setTimeout(() => {
      this.log.info("max call duration reached");
      this.callbacks.onMaxDuration();
    }, this.maxCallDurationMs);
  }

  private resetSilenceTimer(): void {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    this.silenceTimer = setTimeout(() => {
      this.log.info(
        { silentForMs: Date.now() - this.lastSpeechAt },
        "silence timeout"
      );
      this.callbacks.onSilenceTimeout();
    }, this.silenceTimeoutMs);
  }

  destroy(): void {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.durationTimer) clearTimeout(this.durationTimer);
  }
}
