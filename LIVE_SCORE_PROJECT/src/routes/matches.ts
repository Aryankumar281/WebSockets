import { Router, Request, Response } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches";
import { db } from "../db/db.ts";
import { matches } from "../db/schema";
import { getMatchStatus } from "../utils/match-status";
import { desc } from "drizzle-orm";
export const matchRouter = Router();
const MAX_LIMIT = 100;
matchRouter.get("/", async (req: Request, res: Response) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: JSON.stringify(parsed.error),
    });
  }

  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);
  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    return res.status(200).json({ data });
  } catch (e) {
    res
      .status(500)
      .json({ error: "Failed to fetch matches", details: JSON.stringify(e) });
  }
});

matchRouter.post("/", async (req: Request, res: Response) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid Payload",
      details: JSON.stringify(parsed.error),
    });
  }
  const { startTime, endTime, homeScore, awayScore } = parsed.data;

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime) ?? "scheduled",
      })
      .returning();


      if(res.app.locals.broadcastMatchCreated){
        res.app.locals.broadcastMatchCreated(event);
      }
    res
      .status(201)
      .json({ message: "Match created successfully", data: event });
  } catch (e) {
    res
      .status(500)
      .json({ error: "Failed to created Match", details: JSON.stringify(e) });
  }
});
