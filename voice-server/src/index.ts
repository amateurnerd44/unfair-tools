import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { loadConfig } from "./config";
import { createTwilioWebhookRouter } from "./telephony/twilio-webhook";
import { handleTwilioStream } from "./telephony/twilio-stream";
import { CallSession } from "./pipeline/call-session";
import { processPostCall } from "./services/post-call";
import { logger } from "./utils/logger";

const config = loadConfig();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(createTwilioWebhookRouter(config));

const server = createServer(app);

const wss = new WebSocketServer({
  server,
  path: "/media-stream",
});

const activeSessions = new Map<string, CallSession>();

wss.on("connection", (ws: WebSocket, req) => {
  logger.info("new media stream connection");

  handleTwilioStream(ws, req, {
    onStart(mediaSession) {
      logger.info(
        { callSid: mediaSession.callSid, from: mediaSession.callerNumber },
        "starting call session"
      );

      const session = new CallSession(config, mediaSession);
      activeSessions.set(mediaSession.callSid, session);

      session.start().catch((err) => {
        logger.error(
          { callSid: mediaSession.callSid, error: err.message },
          "failed to start call session"
        );
        session.destroy();
        activeSessions.delete(mediaSession.callSid);
      });
    },

    onAudio(mediaSession, pcm16k) {
      const session = activeSessions.get(mediaSession.callSid);
      session?.handleInboundAudio(pcm16k);
    },

    onStop(mediaSession) {
      const session = activeSessions.get(mediaSession.callSid);
      if (!session) return;

      logger.info({ callSid: mediaSession.callSid }, "call ended — running post-call");

      const transcript = session.getTranscript();
      session.destroy();
      activeSessions.delete(mediaSession.callSid);

      processPostCall(config, {
        callSid: mediaSession.callSid,
        callerNumber: mediaSession.callerNumber,
        calledNumber: mediaSession.calledNumber,
        transcript,
        duration: 0,
        status: "completed",
      }).catch((err) => {
        logger.error(
          { callSid: mediaSession.callSid, error: err.message },
          "post-call processing failed"
        );
      });
    },
  });
});

server.listen(config.port, config.host, () => {
  logger.info(
    { port: config.port, host: config.host },
    "voice server started"
  );
});

process.on("SIGTERM", () => {
  logger.info("shutting down");
  for (const [callSid, session] of activeSessions) {
    logger.info({ callSid }, "destroying active session");
    session.destroy();
  }
  activeSessions.clear();
  server.close();
});
