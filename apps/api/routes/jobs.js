const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { jobs } = require('../schema');
const { eq } = require('drizzle-orm');

router.get('/', async (req, res) => {
    try {
        const rows = await db.select().from(jobs);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
})

router.post('/:id/process', async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'id must be a number' })
    }
    try {
        const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
        if (!job) {
            return res.status(404).json({ error: `Job ${id} not found` })
        }

        await db.update(jobs).set({ status: 'processing' }).where(eq(jobs.id, id));
        setTimeout(async () => {
            try {
                const [updated] = await db.update(jobs).set({ status: 'completed' }).where(eq(jobs.id, id)).returning();
                if (!res.headersSent) {
                    res.status(200).json(updated);
                }
            } catch (err) {
                if (!res.headersSent) {
                    res.status(500).json({ error: 'failed to complete my job' });
                }
            }
        }, 2000)
    } catch (err) {
        console.error('Failed to update job')
    }
})
module.exports = router