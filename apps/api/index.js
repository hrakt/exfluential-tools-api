const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const app = require('./app');
const { initDb } = require('./db/db');
const { startWorkerLoopOnce } = require('./workers/queueWorker');

const PORT = process.env.PORT || 3000;

// Create HTTP server with WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server, cors: { origin: '*' } });

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('[ws] client connected');

    ws.on('close', () => {
        clients.delete(ws);
        console.log('[ws] client disconnected');
    });
});

// Broadcast function - export for queueWorker
function broadcastJobComplete(requestId, assetUrl) {
    const message = JSON.stringify({
        type: 'job-completed',
        requestId,
        assetUrl
    });

    clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(message);
        }
    });
}

// Make it available to other modules
global.broadcastJobComplete = broadcastJobComplete;

async function start() {
    try {
        await initDb();
        startWorkerLoopOnce();

        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
    }
}

start();