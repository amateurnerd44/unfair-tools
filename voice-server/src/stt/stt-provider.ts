export interface TranscriptEvent {
  text: string;
  isFinal: boolean;
  confidence: number;
  speechFinal: boolean;
}

export interface STTProvider {
  connect(): Promise<void>;
  sendAudio(pcm16k: Buffer): void;
  onTranscript(callback: (event: TranscriptEvent) => void): void;
  onUtteranceEnd(callback: () => void): void;
  onError(callback: (error: Error) => void): void;
  close(): void;
}
