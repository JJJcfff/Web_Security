const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const boardSize = 15;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));

let currentPlayer = null
let players = [];
let isAI = false
let isInGame = false;


io.on('connection', (socket) => {
    console.log('user connected ' + socket.id);

    socket.on('ai', () => {
        if (players.length !== 0) {
            socket.emit('error', 'game full');
            return;
        }
        players.push(socket.id);
        socket.emit('assign', 'player1');
        isAI = true;
        players.push('ai');
        currentPlayer = socket.id;
        io.emit('beginGame');
        isInGame = true;
        console.log('AI connected as player2');
    });

    socket.on('human', () => {
        isAI = false;
        if (players.length === 0) {
            players.push(socket.id);
            currentPlayer = socket.id;
            socket.emit('assign', 'player1');
            console.log('human player 1 joined the game');
        } else if (players.length === 1) {
            players.push(socket.id);
            socket.emit('assign', 'player2');
            console.log('human player 2 joined the game');
            io.emit('beginGame');
            isInGame = true;
            console.log('game started');
        } else {
            socket.emit('error', 'game full');
            console.log('game full');
        }
    });

    socket.on('makeMove', (data) => {
        // check if valid move
        if (currentPlayer !== socket.id) {
            socket.emit('error', 'not your turn');
            return;
        }
        if (data.x < 0 || data.x >= boardSize || data.y < 0 || data.y >= boardSize) {
            socket.emit('error', 'invalid move');
            return;
        }
        if (!board[data.x][data.y]) {
            board[data.x][data.y] = socket.id === players.at(0) ? 'player1' : 'player2';
            currentPlayer = socket.id === players.at(0) ? players.at(1) : players.at(0);
            io.emit('moveMade', data);
            if (checkTie()) {
                console.log('game over, tie');
                io.emit('gameOver', 'Tie');
                resetStatus();
            } else if (checkConnectStone(data.x, data.y, socket.id === players.at(0) ? 'player1' : 'player2')) {
                console.log('game over', socket.id, 'wins');
                io.emit('gameOver', socket.id === players.at(0) ? 'Player1 wins' : 'Player2 wins');
                resetStatus();
            }
            if (isAI) {
                let move = aiPlayer(board);
                board[move[0]][move[1]] = 'player2';
                io.emit('moveMade', {x: move[0], y: move[1], player: 'ai'});
                if (checkTie()) {
                    console.log('game over, tie');
                    io.emit('gameOver', 'tie');
                    resetStatus();
                } else if (checkConnectStone(move[0], move[1], 'player2')) {
                    console.log('game over', 'AI wins');
                    io.emit('gameOver', 'AI wins');
                    resetStatus();
                }
                currentPlayer = socket.id;
            }
        } else {
            socket.emit('error', 'invalid move');
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        if (isInGame) {
            socket.broadcast.emit('gameOver', 'User left the game');
        }
        resetStatus();
    });

    socket.on('leaveGame', () => {
        if (players !== [] && players.includes(socket.id)) {
            console.log(socket.id, ' left the game');
            if (isInGame) {
                socket.broadcast.emit('gameOver', 'User left the game');
            }
            resetStatus();
            console.log('game reset');
        }
    });
});

function resetStatus() {
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
    currentPlayer = null;
    players = [];
    isAI = false;
    isInGame = false;
}

function checkConnectStone(x, y, player, numStone = 5) {
    let directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    directions = shuffle(directions);
    for (let [dx, dy] of directions) {
        let count = 0;
        for (let step = -4; step <= 4; step++) {
            const newX = x + step * dx;
            const newY = y + step * dy;
            if (newX < 0 || newX >= boardSize || newY < 0 || newY >= boardSize) {
                continue;
            }
            if (board[newX][newY] === player) {
                count++;
                if (count === numStone) return true;
            } else {
                count = 0;
            }
        }
    }
    return false;
}


function checkTie() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === null) {
                return false;
            }
        }
    }
    return true;
}


//Dumb AI
function aiPlayer() {
    for (let numStone = 5; numStone >= 1; numStone--) {
        for (let x = 0; x < boardSize; x++) {
            for (let y = 0; y < boardSize; y++) {
                if (board[x][y] === null) {
                    board[x][y] = 'player2';
                    if (checkConnectStone(x, y, 'player2', numStone)) {
                        return [x, y];
                    }
                    board[x][y] = null;

                    board[x][y] = 'player1';
                    if (checkConnectStone(x, y, 'player1', numStone)) {
                        return [x, y];
                    }
                    board[x][y] = null;
                }
            }
        }
    }
    // just in case
    let x = Math.floor(Math.random() * boardSize);
    let y = Math.floor(Math.random() * boardSize);
    while (board[x][y] !== null) {
        x = Math.floor(Math.random() * boardSize);
        y = Math.floor(Math.random() * boardSize);
    }
    return [x, y];
}

function shuffle(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
        let j = Math.floor(Math.random() * i);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


app.use(express.static('public'));

server.listen(3000, () => {
    console.log('server started, listening on port 3000');
});

