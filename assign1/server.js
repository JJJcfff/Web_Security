const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const {compileETag} = require("express/lib/utils");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const boardSize = 15;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
let currentPlayer = null;
let player1 = false;
let player2 = false;
let isAI = false;


io.on('connection', (socket) => {
    if (!player1) {
        player1 = socket;
        currentPlayer = 'player1';
        socket.emit('assign', 'player1');
        console.log('player1 connected');
    } else if (!player2 && !isAI) {
        player2 = socket;
        socket.emit('assign', 'player2');
        io.emit('player2Connected');
        console.log('player2 connected');
    } else {
        socket.emit('error', 'Game is full');
    }

    socket.on('ai', () => {
        isAI = true;
        player2 = 'ai';
        console.log('AI connected as player2');
    });

    socket.on('makeMove', (data) => {
        if (!board[data.x][data.y]) {
            board[data.x][data.y] = data.player;
            currentPlayer = data.player === 'player1' ? 'player2' : 'player1';
            io.emit('moveMade', data);
        }
    });


    socket.on('disconnect', () => {
        resetStatus();
        console.log('users disconnected');
        io.emit('userDisconnected');
    });

    socket.on('leaveGame', () => {
        socket.disconnect();
        console.log('user left');
    });
});

// Serve static files
app.use(express.static('public'));

server.listen(3000, () => {
    console.log('server started, listening on port 3000');
});


function resetStatus() {
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
    currentPlayer = null;
    player1 = false;
    player2 = false;
    isAI = false;
}
