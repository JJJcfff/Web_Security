const express = require('express');
const WebSocket = require('ws');
const app = express();
const PORT = 3000;

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log(`Received message => ${message}`);
        const data = JSON.parse(message);
        if (data.type === 'move') {
            const isValid = true;
            //TODO: Check if move is valid
            if (isValid) {

            } else {
                ws.send(JSON.stringify({ type: 'invalid' }));
            }

        }
    });
});

app.use(express.static('public'));

const server = app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
