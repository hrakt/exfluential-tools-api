const express = require('express');
const app = express();
const cors = require('cors');

const { db, initDb } = require('./db');
const { tools, jobs } = require('./schema');
const { eq } = require('drizzle-orm');

app.use(cors());
app.use(express.json());

app.use('/requests', require('./routes/requests'));

app.use('/jobs', require('./routes/jobs'));

app.use('/tools', require('./routes/tools'));

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