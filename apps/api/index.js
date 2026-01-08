const app = require('./app');
const { initDb } = require('./db/db');
const { startWorkerLoopOnce } = require('./workers/queueWorker');

const PORT = process.env.PORT || 3000;
async function start() {
    try {
        await initDb();
        console.log('DB ready')

        // Start the background worker
        startWorkerLoopOnce();

        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
    }
}

start();