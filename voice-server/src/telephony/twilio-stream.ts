import WebSocket from "ws";
import { IncomingMessage } from "http";
import { callLogger } from "../utils/logger";
import { mulawToPcm16, pcm16ToMulaw, resample } from "./audio-encoding";

export interface TwilioStreamEvents {
  onStart: (session: TwilioMediaSession) => void;
  onAudio: (session: TwilioMediaSession, pcm16k: Buffer) => void;
  onStop: (session: TwilioMediaSession) => void;
}

export interface TwilioMediaSession {
  callSid: string;
  streamSid: string;
  callerNumber: string;
  calledNumber: string;
  sendAudio: (pcm24k: Buffer) => void;
  clearAudio: () => void;
  close: () => void;
}

interface TwilioMessage {
  event: string;
  sequenceNumber?: string;
  streamSid?: string;
  start?: {
    streamSid: string;
    callSid: string;
    customParameters: Record<string, string>;
    mediaFormat: {
      encoding: string;
      sampleRate: number;
      channels: number;
    };
  };
  media?: {
    payload: string;
    timestamp: string;
    chunk: string;
  };
  stop?: {
    accountSid: string;
    callSid: string;
  };
}

export function handleTwilioStream(
  ws: WebSocket,
  _req: IncomingMessage,
  events: TwilioStreamEvents
): void {
  let session: TwilioMediaSession | null = null;
  let log = callLogger("unknown");

  ws.on("message", (data: WebSocket.RawData) => {
    let msg: TwilioMessage;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      log.warn("received non-JSON message from Twilio");
      return;
    }

    switch (msg.event) {
      case "connected":
        log.debug("twilio stream connected");
        break;

      case "start": {
        const start = msg.start!;
        const streamSid = start.streamSid;
        const callSid = start.customParameters.callSid || start.callSid;
        log = callLogger(callSid);
        log.info({ streamSid }, "media stream started");

        session = {
          callSid,
          streamSid,
          callerNumber: start.customParameters.callerNumber || "",
          calledNumber: start.customParameters.calledNumber || "",

          sendAudio(pcm24k: Buffer) {
            const pcm8k = resample(pcm24k, 24000, 8000);
            const mulaw = pcm16ToMulaw(pcm8k);
            const payload = mulaw.toString("base64");

            ws.send(
              JSON.stringify({
                event: "media",
                streamSid,
                media: { payload },
              })
            );
          },

          clearAudio() {
            ws.send(JSON.stringify({ event: "clear", streamSid }));
          },

          close() {
            ws.close();
          },
        };

        events.onStart(session);
        break;
      }

      case "media": {
        if (!session || !msg.media) break;

        const mulawBuf = Buffer.from(msg.media.payload, "base64");
        const pcm8k = mulawToPcm16(mulawBuf);
        const pcm16k = resample(pcm8k, 8000, 16000);

        events.onAudio(session, pcm16k);
        break;
      }

      case "stop":
        log.info("media stream stopped");
        if (session) events.onStop(session);
        break;

      default:
        log.debug({ event: msg.event }, "unhandled twilio event");
    }
  });

  ws.on("close", () => {
    log.info("twilio websocket closed");
    if (session) events.onStop(session);
  });

  ws.on("error", (err) => {
    log.error({ error: err.message }, "twilio websocket error");
  });
}
