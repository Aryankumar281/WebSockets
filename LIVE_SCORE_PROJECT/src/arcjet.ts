import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";
import { Request, Response } from "express";
const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_ENV === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) {
  throw new Error("ARCJET_KEY is not defined in environment variables");
}

export const httpArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
            allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: arcjetMode, interval: "10s", max: 50 }),
      ],
    })
  : null;

export const wsArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
            allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: arcjetMode, interval: "2s", max: 5 }),
      ],
    })
  : null;

export function securityMiddleware() {
  return async (req: Request, res: Response, next: Function) => {
    if (!httpArcjet) return next();

    try {
      const decision = await httpArcjet.protect(req);
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({ error: "Too many requests" });
        }
        return res.status(403).json({ error: "Forbidden" });
      }
    } catch (err) {
      console.error("Arcjet error:", err);
      return res.status(503).json({ error: "Service unavailable" });
    }
    next();
  };
}
