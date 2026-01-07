const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { tools, jobs } = require('../schema');
const { eq } = require('drizzle-orm');

router.get('/', async (req, res) => {
    try {
        const rows = await db.select().from(tools);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tools' });
    }
})

router.post('/', async (req, res) => {
    const { name, type } = req.body;

    const allowedTypes = ['calculator', 'guide', 'form'];

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'name is required and must be a string' })
    }

    if (!allowedTypes.includes(type)) {
        return res.status(400).json({ error: `type must be onf othe: ${allowedTypes.join(', ')}` })
    }

    try {
        const [newTool] = await db.insert(tools).values({ name, type, active: true }).returning();
        res.status(201).json(newTool)
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create a too' })
    }
});

router.patch('/:id/toggle', async (req, res) => {
    const id = Number(req.params.id);

    try {
        const [tool] = await db.select().from(tools).where(eq(tools.id, id));

        if (!tool) {
            return res.status(404).json({ error: `Tool ${id} not found` });
        }
        const newActive = !tool.active;

        const [updated] = await db.update(tools).set({ active: newActive }).where(eq(tools.id, id)).returning();
        res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle tool' })
    }
})

router.post('/:id/sync', async (req, res) => {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'id must be anumber' })
    }

    try {
        const [tool] = await db.select().from(tools).where(eq(tools.id, id));
        if (!tool) {
            return res.status(404).json({ error: `Tool ${id} not found` })
        }

        const [job] = await db.insert(jobs).values({ toolId: id, type: 'sync-tool', status: 'queued' }).returning();

        res.status(202).json({ message: 'Sync job queued', job });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to queue async job' })
    }
});

module.exports = router;