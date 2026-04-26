import { Router, Request, Response } from "express";
import { Config } from "../config";
import { logger } from "../utils/logger";

export function createTwilioWebhookRouter(config: Config): Router {
  const router = Router();

  router.post("/voice/incoming", (req: Request, res: Response) => {
    const callSid = req.body.CallSid as string;
    const from = req.body.From as string;
    const to = req.body.To as string;

    logger.info({ callSid, from, to }, "incoming call");

    const wsUrl = config.publicUrl.replace(/^http/, "ws") + "/media-stream";

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="callSid" value="${callSid}" />
      <Parameter name="callerNumber" value="${from}" />
      <Parameter name="calledNumber" value="${to}" />
    </Stream>
  </Connect>
</Response>`;

    res.type("text/xml").send(twiml);
  });

  router.post("/voice/status", (req: Request, res: Response) => {
    const callSid = req.body.CallSid as string;
    const status = req.body.CallStatus as string;
    const duration = req.body.CallDuration as string;

    logger.info({ callSid, status, duration }, "call status update");
    res.sendStatus(200);
  });

  router.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "voice-server" });
  });

  return router;
}
