export type CallState = "idle" | "listening" | "processing" | "speaking";

export interface PipelineTimings {
  sttStartedAt?: number;
  sttCompletedAt?: number;
  llmStartedAt?: number;
  llmFirstTokenAt?: number;
  llmCompletedAt?: number;
  ttsStartedAt?: number;
  ttsFirstAudioAt?: number;
  ttsCompletedAt?: number;
}

export function measureLatency(timings: PipelineTimings): Record<string, number> {
  const result: Record<string, number> = {};

  if (timings.sttStartedAt && timings.sttCompletedAt) {
    result.sttMs = timings.sttCompletedAt - timings.sttStartedAt;
  }
  if (timings.sttCompletedAt && timings.llmFirstTokenAt) {
    result.llmTimeToFirstTokenMs = timings.llmFirstTokenAt - timings.sttCompletedAt;
  }
  if (timings.llmStartedAt && timings.llmCompletedAt) {
    result.llmTotalMs = timings.llmCompletedAt - timings.llmStartedAt;
  }
  if (timings.ttsStartedAt && timings.ttsFirstAudioAt) {
    result.ttsTimeToFirstAudioMs = timings.ttsFirstAudioAt - timings.ttsStartedAt;
  }
  if (timings.sttCompletedAt && timings.ttsFirstAudioAt) {
    result.endToEndMs = timings.ttsFirstAudioAt - timings.sttCompletedAt;
  }

  return result;
}
