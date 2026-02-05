import { Router } from 'express';
import { matchIdParamSchema } from '../validation/matches';
import { createCommentarySchema, listCommentaryQuerySchema } from '../validation/commentary';
import { commentary } from '../db/schema';
import { db } from '../db/db';
import { desc, eq } from 'drizzle-orm';

const MAX_LIMIT = 100;

export const commentryRouter = Router({ mergeParams: true });

commentryRouter.get('/', async (req, res) => {
    try {
        const paramsResult = matchIdParamSchema.safeParse(req.params);
        if (!paramsResult.success) {
            return res.status(400).json({ error: 'Invalid match ID parameter', details: paramsResult.error.issues });
        }

        const queryResult = listCommentaryQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({ error: 'Invalid query parameters', details: queryResult.error.issues });
        }

        const { id: matchId } = paramsResult.data;
        const limit = Math.min(queryResult.data.limit ?? 100, MAX_LIMIT);

        const results = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        const formattedResults = results.map(row => ({
            ...row,
            tags: row.tags ? JSON.parse(row.tags as string) : [],
        }));

        return res.status(200).json(formattedResults);
    } catch (error) {
        console.error('Error fetching commentary:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

commentryRouter.post('/',async (req, res) => {
    const paramsResult = matchIdParamSchema.safeParse(req.params);
    if (!paramsResult.success) {
        return res.status(400).json({ error: 'Invalid match ID parameter' ,details: paramsResult.error.issues});
    }
    const bodyRsult = createCommentarySchema.safeParse(req.body);
    if (!bodyRsult.success) {
        return res.status(400).json({ error: 'Invalid request body', details: bodyRsult.error.issues });
    }
    try {
        const {minute, tags, ...rest} = bodyRsult.data;
        const [result]=await db.insert(commentary).values({
            matchId: paramsResult.data.id,
            minute,
            tags: JSON.stringify(tags),
            ...rest,
        }).returning();
        return  res.status(201).json({
            ...result,
            tags: result.tags ? JSON.parse(result.tags as string) : [],
        });
        
    } catch (error) {
        console.error('Error creating commentary:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});