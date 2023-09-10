const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const {compileETag} = require("express/lib/utils");

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
    console.log('user connected '+ socket.id);

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
                io.emit('gameOver', 'tie');
                resetStatus();
            } else if (checkWin(data.x, data.y)) {
                console.log('game over', socket.id , 'wins');
                io.emit('gameOver', socket.id === players.at(0) ? 'player1 wins' : 'player2 wins');
                resetStatus();
            }
            if (isAI) {
                let move = aiPlayer();
                board[move[0]][move[1]] = 'player2';
                io.emit('moveMade', {x: move[0], y: move[1], player: 'ai'});
                if (checkTie()) {
                    console.log('game over, tie');
                    io.emit('gameOver', 'tie');
                    resetStatus();
                } else if (checkWin(move[0], move[1])) {
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
        if(isInGame){
            socket.broadcast.emit('gameOver', 'User left the game');
        }
        resetStatus();
    });

    socket.on('leaveGame', () => {
        if(players !== [] && players.includes(socket.id)) {
            console.log(socket.id,' left the game');
            if (isInGame) {
                socket.broadcast.emit('gameOver', 'User left the game');
            }
            resetStatus();
            console.log('game reset');
        }
    });
});

app.use(express.static('public'));

server.listen(3000,() => {
    console.log('server started, listening on port 3000');
});

function resetStatus() {
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
    currentPlayer = null;
    players = [];
    isAI = false;
    isInGame = false;
}

function checkWin(x, y) {
    console.log("check win x y", x, y);
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

function checkTie() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++){
            if(board[i][j] === null){
                return false;
            }
        }
    }
    return true;
}



//AI PLAYER FUNCTIONS WIP
function aiPlayer() {
    let bestScore = -Infinity;
    let bestMove;

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === null) {
                board[i][j] = AI_PLAYER;
                let score = minimax(board, 0, false);
                board[i][j] = null;
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = [i, j];
                }
            }
        }
    }

    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    if (depth === MAX_DEPTH) {
        return 0; // Neutral score for non-terminal states at max depth
    }

    if (checkWinForPlayer(board, HUMAN_PLAYER)) {
        return -10 + depth; // Favor quicker wins and slower losses
    }

    if (checkWinForPlayer(board, AI_PLAYER)) {
        return 10 - depth;
    }

    if (checkTie()) {
        return 0;
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (board[i][j] === null) {
                    board[i][j] = AI_PLAYER;
                    let eval = minimax(board, depth + 1, false);
                    board[i][j] = null;
                    maxEval = Math.max(maxEval, eval);
                }
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (board[i][j] === null) {
                    board[i][j] = HUMAN_PLAYER;
                    let eval = minimax(board, depth + 1, true);
                    board[i][j] = null;
                    minEval = Math.min(minEval, eval);
                }
            }
        }
        return minEval;
    }
}

function checkWinForPlayer(board, player) {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === player) {
                if (checkWin(i, j)) {
                    return true;
                }
            }
        }
    }
    return false;
}


