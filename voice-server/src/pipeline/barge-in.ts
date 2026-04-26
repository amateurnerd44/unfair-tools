import { callLogger } from "../utils/logger";

export interface BargeInCallbacks {
  onBargeIn: () => void;
}

export class BargeInDetector {
  private energyThreshold: number;
  private consecutiveFrames = 0;
  private requiredFrames: number;
  private log;

  constructor(
    callSid: string,
    opts: { energyThreshold?: number; requiredFrames?: number } = {}
  ) {
    this.energyThreshold = opts.energyThreshold ?? 500;
    this.requiredFrames = opts.requiredFrames ?? 3;
    this.log = callLogger(callSid);
  }

  processAudio(pcm16k: Buffer, callbacks: BargeInCallbacks): void {
    const energy = this.calculateRmsEnergy(pcm16k);

    if (energy > this.energyThreshold) {
      this.consecutiveFrames++;
      if (this.consecutiveFrames >= this.requiredFrames) {
        this.log.info({ energy, frames: this.consecutiveFrames }, "barge-in detected");
        this.reset();
        callbacks.onBargeIn();
      }
    } else {
      this.consecutiveFrames = 0;
    }
  }

  reset(): void {
    this.consecutiveFrames = 0;
  }

  private calculateRmsEnergy(pcm: Buffer): number {
    const samples = pcm.length / 2;
    if (samples === 0) return 0;

    let sumSquares = 0;
    for (let i = 0; i < pcm.length; i += 2) {
      const sample = pcm.readInt16LE(i);
      sumSquares += sample * sample;
    }

    return Math.sqrt(sumSquares / samples);
  }
}
