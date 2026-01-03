const express = require('express');
const app = express();

app.use(express.json());

let tools = [];
let nextId = 1;

app.get('/tools', (req, res) => {
    res.status(200).json(tools);
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})