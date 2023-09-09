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
let player1 = null;
let player2 = null;
let isAI = false;


io.on('connection', (socket) => {
    console.log('user connected '+ socket.id);

    socket.on('ai', () => {
        if (player1) {
            socket.emit('error', 'game full');
            return;
        }
        player1 = socket.id;
        socket.emit('assign', 'player1');
        isAI = true;
        player2 = 'ai';
        console.log('AI connected as player2');
    });

    socket.on('human', () => {
        isAI = false;
        if (!player1) {
            player1 = socket.id;
            socket.emit('assign', 'player1');
            console.log('human player 1 joined the game');
        } else if (!player2) {
            player2 = socket.id;
            socket.emit('assign', 'player2');
            console.log('human player 2 joined the game');
            io.emit('beginGame');
            console.log('game started');
        } else {
            socket.emit('error', 'game full');
            console.log('game full');
        }
    });

    socket.on('makeMove', (data) => {
        // check if valid move
        if (currentPlayer !== socket.id) {
            return;
        }
        if (data.x < 0 || data.x >= boardSize || data.y < 0 || data.y >= boardSize) {
            return;
        }
        if (!board[data.x][data.y]) {
            board[data.x][data.y] = socket.id === player1 ? 'player1' : 'player2';
            currentPlayer = socket.id === player1 ? 'player2' : 'player1';
            io.emit('moveMade', data);
            //TODO: check win
        } else {
            socket.emit('error', 'invalid move');
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('leaveGame', () => {
        console.log('user left the game');
        if (player2){
            io.emit('gameOver', 'User left the game');
        }
        console.log(player1);
        console.log(player2);
        resetStatus();
    });
});

// Serve static files
app.use(express.static('public'));

server.listen(3000, () => {
    console.log('server started, listening on port 3000');
});

function resetStatus() {
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
    currentPlayer = 'player1';
    player1 = null;
    player2 = null;
    isAI = false;
}

function checkWin(x, y) {
    const directions = [
        [1, 0], // horizontal
        [0, 1], // vertical
        [1, 1], // diagonal
        [1, -1] // diagonal
    ];

    for (let i = 0; i < directions.length; i++) {
        let count = 1;
        for (let j = 1; j < 5; j++) {
            const dx = x + j * directions[i][0];
            const dy = y + j * directions[i][1];
            if (dx < 0 || dx >= boardSize || dy < 0 || dy >= boardSize || board[dx][dy] !== board[x][y]) {
                break;
            }
            count++;
        }
        for (let j = 1; j < 5; j++) {
            const dx = x - j * directions[i][0];
            const dy = y - j * directions[i][1];
            if (dx < 0 || dx >= boardSize || dy < 0 || dy >= boardSize || board[dx][dy] !== board[x][y]) {
                break;
            }
            count++;
        }
        if (count >= 5) {
            return true;
        }
    }
    return false;
}
