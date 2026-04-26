export class SentenceBuffer {
  private buffer = "";

  constructor(private onSentence: (sentence: string) => void) {}

  addToken(token: string): void {
    this.buffer += token;

    const sentenceEndPattern = /[.!?]+[\s]|[.!?]+$/;
    const match = this.buffer.match(sentenceEndPattern);

    if (match && match.index !== undefined) {
      const endIndex = match.index + match[0].length;
      const sentence = this.buffer.substring(0, endIndex).trim();
      this.buffer = this.buffer.substring(endIndex);

      if (sentence.length > 0) {
        this.onSentence(sentence);
      }
    }
  }

  flush(): void {
    const remaining = this.buffer.trim();
    if (remaining.length > 0) {
      this.onSentence(remaining);
    }
    this.buffer = "";
  }

  clear(): void {
    this.buffer = "";
  }
}
