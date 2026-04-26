import { PrismaClient } from "@prisma/client";
import { callLogger } from "../utils/logger";

const prisma = new PrismaClient();

export interface CallRecord {
  callSid: string;
  callerNumber: string;
  calledNumber: string;
  customerId?: string;
  transcript: string;
  duration: number;
  status: "completed" | "failed" | "transferred" | "timeout";
  summary?: string;
}

export async function saveCallRecord(record: CallRecord): Promise<string> {
  const log = callLogger(record.callSid);

  try {
    const callLog = await prisma.callLog.create({
      data: {
        callSid: record.callSid,
        callerNumber: record.callerNumber,
        calledNumber: record.calledNumber,
        customerId: record.customerId,
        transcript: record.transcript,
        durationSeconds: record.duration,
        status: record.status,
        summary: record.summary,
      },
    });

    log.info({ callLogId: callLog.id }, "call record saved");
    return callLog.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ error: msg }, "failed to save call record");
    throw err;
  }
}
