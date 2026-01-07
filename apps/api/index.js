const app = require('./app');
const { initDb } = require('./db/db');

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