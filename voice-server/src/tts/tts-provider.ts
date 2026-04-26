export interface TTSProvider {
  connect(): Promise<void>;
  synthesize(
    text: string,
    onAudioChunk: (pcmChunk: Buffer) => void
  ): Promise<void>;
  cancel(): void;
  close(): void;
}
