const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { requests, jobs } = require('../db/schema');
const { eq, sql } = require('drizzle-orm');
const { generateAssetFromRequest } = require('../services/aiService');
const { startWorkerLoopOnce } = require('../workers/queueWorker');


// POST /requests
router.post('/', async (req, res) => {
    const { doctorName, practiceName, practiceType, channel, primaryMessage } = req.body;

    // Basic validation
    if (!doctorName || !practiceName || !practiceType || !channel || !primaryMessage) {
        return res.status(400).json({ error: 'Missing required fields: doctorName, practiceName, practiceType, channel, primaryMessage' });
    }

    try {
        // Insert new request
        const [newRequest] = await db.insert(requests).values({
            doctorName,
            practiceName,
            practiceType,
            channel,
            primaryMessage,
            status: 'pending'
        }).returning();

        await db.insert(jobs).values({
            requestId: newRequest.id,
            type: 'generate-asset',
            status: 'queued'
        });

        startWorkerLoopOnce();
        // Return accepted
        res.status(202).json(newRequest);

    } catch (err) {
        console.error('Failed to create request:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/all', async (req, res) => {
    try {
        const allRequests = await db.select().from(requests);
        res.json(allRequests);
    } catch (err) {
        console.error('Failed to fetch requests:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// GET /requests/:id
router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const [request] = await db.select().from(requests).where(eq(requests.id, id));

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json(request);

    } catch (err) {
        console.error('Failed to fetch request:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
