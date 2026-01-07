const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { requests } = require('../db/schema');
const { eq } = require('drizzle-orm');
const { generateAssetFromRequest } = require('../services/aiService');

// Helper for async processing
async function processRequest(requestId) {
    try {
        console.log(`[Worker] Starting job for request ${requestId}`);

        // 1. Update status to processing
        await db.update(requests)
            .set({ status: 'processing' })
            .where(eq(requests.id, requestId));

        // Fetch the fresh request data
        const [reqData] = await db.select().from(requests).where(eq(requests.id, requestId));

        if (!reqData) {
            console.error(`[Worker] Request ${requestId} not found during processing.`);
            return;
        }

        // 2. Call AI Service
        try {
            const assetResult = await generateAssetFromRequest(reqData);

            // 3. Success: Update to ready
            await db.update(requests)
                .set({
                    status: 'ready',
                    assetUrl: assetResult,
                    updatedAt: new Date()
                })
                .where(eq(requests.id, requestId));

            console.log(`[Worker] Job ${requestId} completed successfully.`);

        } catch (aiError) {
            console.error(`[Worker] AI generation failed for ${requestId}:`, aiError);

            // Failure: Update to failed
            await db.update(requests)
                .set({
                    status: 'failed',
                    errorMessage: aiError.message || 'Unknown error during generation',
                    updatedAt: new Date()
                })
                .where(eq(requests.id, requestId));
        }

    } catch (err) {
        console.error(`[Worker] System error processing request ${requestId}:`, err);
    }
}

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

        // Trigger background processing (fire-and-forget)
        processRequest(newRequest.id);

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