const express = require('express');
const app = express();

const { db, initDb } = require('./db');
const { tools } = require('./schema');
const { eq } = require('drizzle-orm');

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