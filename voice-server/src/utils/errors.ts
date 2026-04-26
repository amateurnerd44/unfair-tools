export class VoiceServerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = false
  ) {
    super(message);
    this.name = "VoiceServerError";
  }
}

export class STTError extends VoiceServerError {
  constructor(message: string, recoverable = true) {
    super(message, "STT_ERROR", recoverable);
    this.name = "STTError";
  }
}

export class TTSError extends VoiceServerError {
  constructor(message: string, recoverable = true) {
    super(message, "TTS_ERROR", recoverable);
    this.name = "TTSError";
  }
}

export class LLMError extends VoiceServerError {
  constructor(message: string, recoverable = true) {
    super(message, "LLM_ERROR", recoverable);
    this.name = "LLMError";
  }
}

export class TelephonyError extends VoiceServerError {
  constructor(message: string, recoverable = false) {
    super(message, "TELEPHONY_ERROR", recoverable);
    this.name = "TelephonyError";
  }
}
