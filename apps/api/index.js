const express = require('express');
const app = express();
const cors = require('cors');

const { db, initDb } = require('./db');
const { tools, jobs } = require('./schema');
const { eq } = require('drizzle-orm');

const allowedOrigins = [
    'http://localhost:5173',
    'exfluential-tools-api-web.vercel.app'
];

app.use(
    cors({
        origin: (origin, callback) => {
            // allow tools like Postman (no origin)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    })
);
app.use(express.json());



app.get('/tools', async (req, res) => {
    try {
        const rows = await db.select().from(tools);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tools' });
    }
})

app.post('/tools', async (req, res) => {
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

app.patch('/tools/:id/toggle', async (req, res) => {
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

app.post('/tools/:id/sync', async (req, res) => {
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

app.get('/jobs', async (req, res) => {
    try {
        const rows = await db.select().from(jobs);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
})

app.post('/jobs/:id/process', async (req, res) => {
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

const PORT = process.env.PORT || 3000;
async function start() {
    try {
        await initDb();
        console.log('DB ready')

        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
    }
}

start();