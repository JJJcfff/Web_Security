const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const boardSize = 15;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
let player1 = false;
let player2 = false;
let isAI = false;

function userDisconnected(player) {
    console.log(player + ' disconnected');
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
    io.emit('userDisconnected', player);
    player1 = false;
    player2 = false;
    isAI = false;
}

io.on('connection', (socket) => {
    if (!player1) {
        player1 = socket;
        socket.emit('assignColor', 'player1');
        console.log('player1 connected');
    }
    else if (!player2 && !isAI) {
        player2 = socket;
        socket.emit('assignColor', 'player2');
        console.log('player2 connected');
    }
    else {
        socket.emit('error', 'Game is full');
    }

    socket.on('ai', () => {
        isAI = true;
        player2 = 'ai';
        socket.emit('assignColor', 'player2');
        console.log('AI connected as player2');
    });

    socket.on('makeMove', (data) => {
        if (!board[data.x][data.y]) {
            board[data.x][data.y] = data.player;
            currentPlayer = data.player === 'player1' ? 'player2' : 'player1';
            io.emit('moveMade', data);
        }
    });

    socket.on('leaveGame', () => {
        userDisconnected();
    });

    socket.on('disconnect', () => {
        userDisconnected();
        // if (socket === player1) {
        //     player1 = false;
        //     if (player2 === 'ai') {
        //         player2 = false;
        //         isAI = false;
        //     }
        //     console.log('player1 disconnected');
        //     console.log('AI disconnected');
        // } else if (socket === player2) {
        //     player2 = false;
        //     console.log('player2 disconnected');
        // }
    });
});

// Serve static files
app.use(express.static('public'));

server.listen(3000, () => {
    console.log('server started, listening on port 3000');
});
