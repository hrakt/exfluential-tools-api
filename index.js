const express = require('express');
const app = express();

app.use(express.json());

let tools = [];
let nextId = 1;

app.get('/tools', (req, res) => {
    res.status(200).json(tools);
})

app.post('/tools', (req, res) => {
    const { name, type } = req.body;

    const allowedTypes = ['calculator', 'guide', 'form'];

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'name is required and must be a string' })
    }

    if (!allowedTypes.includes(type)) {
        return res.status(400).json({ error: `type must be onf othe: ${allowedTypes.join(', ')}` })
    }

    const newTool = {
        id: nextId++,
        name,
        type,
        active: true
    }

    tools.push(newTool);
    res.status(201).json(newTool);
});

app.patch('/tools/:id/toggle', (req, res) => {
    const id = Number(req.params.id);
    const tool = tools.find(t => t.id === id);

    if (!tool) {
        res.status(400).json({ error: "No tool found with this id" })
    }
    tool.active = !tool.active

    res.status(200).json(tool)
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})