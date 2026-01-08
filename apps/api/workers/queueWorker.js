const { db } = require('../db/db');
const { jobs, requests } = require('../db/schema');
const { eq, sql } = require('drizzle-orm');
const { generateAssetFromRequest } = require('../services/aiService')

let workerStarted = false;

function startWorkerLoopOnce(pollMs = 1000) {
    if (workerStarted) return;
    workerStarted = true;
    console.log(`[worker] started (poll every ${pollMs}ms)`);

    setInterval(() => {
        tickWorker().catch((err) => console.error('[worker] tick failed', err));
    }, pollMs);
}

async function tickWorker() {
    await db.transaction(async (tx) => {
        // Claim one job using FOR UPDATE SKIP LOCKED
        const claimedJobs = await tx.execute(sql`
            SELECT id, "requestId", type, status
            FROM jobs
            WHERE status = 'queued'
              AND run_at <= NOW()
            ORDER BY run_at ASC, id ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        `);

        // If no job available, exit early
        if (!claimedJobs.rows || claimedJobs.rows.length === 0) {
            console.log('[worker] no jobs available');
            return;
        }

        const job = claimedJobs.rows[0];
        console.log(`[worker] claimed job ${job.id} for request ${job.requestId}`);

        // Mark the job as 'processing'
        await tx.update(jobs)
            .set({
                status: 'processing',
                lockedAt: new Date()
            })
            .where(eq(jobs.id, job.id));

        // Mark the related request as 'processing'
        await tx.update(requests)
            .set({ status: 'processing' })
            .where(eq(requests.id, job.requestId));

        console.log(`[worker] job ${job.id} and request ${job.requestId} marked as processing`);

        // Fetch the full request data
        const [request] = await tx.select().from(requests).where(eq(requests.id, job.requestId));

        if (!request) {
            throw new Error(`Request ${job.requestId} not found`);
        }

        // Execute the job based on type
        try {
            let result;

            if (job.type === 'generate-asset') {
                result = await generateAssetFromRequest(request);
            } else {
                throw new Error(`Unknown job type: ${job.type}`);
            }

            // Job succeeded - update job and request
            await tx.update(jobs)
                .set({ status: 'completed' })
                .where(eq(jobs.id, job.id));

            await tx.update(requests)
                .set({
                    status: 'completed',
                    assetUrl: result.assetUrl
                })
                .where(eq(requests.id, job.requestId));

            console.log(`[worker] job ${job.id} completed successfully`);

        } catch (error) {
            console.error(`[worker] job ${job.id} failed:`, error);

            // Fetch current attempts
            const [currentJob] = await tx.select().from(jobs).where(eq(jobs.id, job.id));
            const newAttempts = (currentJob.attempts || 0) + 1;
            const maxAttempts = currentJob.maxAttempts || 3;

            if (newAttempts < maxAttempts) {
                // Retry: set back to queued
                await tx.update(jobs)
                    .set({
                        status: 'queued',
                        attempts: newAttempts,
                        lastError: error.message
                    })
                    .where(eq(jobs.id, job.id));

                console.log(`[worker] job ${job.id} will retry (attempt ${newAttempts}/${maxAttempts})`);
            } else {
                // Max attempts reached: mark as failed
                await tx.update(jobs)
                    .set({
                        status: 'failed',
                        attempts: newAttempts,
                        lastError: error.message
                    })
                    .where(eq(jobs.id, job.id));

                await tx.update(requests)
                    .set({
                        status: 'failed',
                        errorMessage: error.message
                    })
                    .where(eq(requests.id, job.requestId));

                console.log(`[worker] job ${job.id} failed permanently after ${newAttempts} attempts`);
            }
        }
    });
}

module.exports = { startWorkerLoopOnce };