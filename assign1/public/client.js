const boardSize = 15;
const cellSize = 30;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
const socket = io('http://localhost:3000');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentPlayer = null;
let assignedPlayer = null;
let isAI = false;
let hasMoved = false;
let isGameOver = false;
// socket events
socket.on('assign', (player) => {
    if(!isAI) {
        assignedPlayer = player;
        document.getElementById('gameTitle').textContent = 'Playing against Human. You are ' + assignedPlayer;
        console.log('assigned player: ' + assignedPlayer);
    } else {
        assignedPlayer = 'player1';
        document.getElementById('gameTitle').textContent = 'Playing against AI';
        console.log('assigned player: ' + assignedPlayer);
    }
});

socket.on('beginGame', () => {
    currentPlayer = 'player1';
    if (assignedPlayer === 'player1') {
        document.getElementById('gameStatus').textContent = 'Your turn';
    } else {
        document.getElementById('gameStatus').textContent = 'Opponent\'s turn';
    }
});
socket.on('moveMade', (data) => {
    console.log(data);
    if (assignedPlayer === 'player1') {
        board[data.x][data.y] = data.player === socket.id ? 'player1' : 'player2';
    } else {
        board[data.x][data.y] = data.player === socket.id ? 'player2' : 'player1';
    }
    hasMoved = data.player === socket.id;
    renderBoard();
    switchPlayer();
});
socket.on('error', (message) => {
    alert(message);
    returnToMenu();
});
socket.on('gameOver', (message) => {
    console.log('game over');
    document.getElementById('gameStatus').textContent = 'Game Over';
    renderBoard();
    isGameOver = true;
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
    alert(message);
});

// game logic
function handleCellClick(x, y) {
    if (!isGameOver) {
        if (board[x][y]) {
            alert('Cannot place piece here');
            return;
        } else if (assignedPlayer !== currentPlayer) {
            console.log(assignedPlayer," ", currentPlayer);
            alert('Not your turn (Or waiting for other player)');
            return;
        }
        socket.emit('makeMove', {x, y, player: socket.id});
    } else {
        alert('Game has ended. Please return to menu');
    }
}

function startGame(mode) {
    resetStatus();
    const gameTitle = document.getElementById('gameTitle');
    if (mode === 'ai') {
        gameTitle.textContent = 'Playing against AI';
        isAI = true;
        socket.emit('ai');
    } else {
        gameTitle.textContent = 'Playing against Another Player'
        isAI = false;
        socket.emit('human');
    }
    showGame();
    renderBoard();
}

function switchPlayer() {
    currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
    if (currentPlayer === assignedPlayer) {
        document.getElementById('gameStatus').textContent = 'Your turn';
    } else {
        document.getElementById('gameStatus').textContent = 'Opponent\'s turn';
    }
}


// canvas functions
canvas.addEventListener('click', (event) => {
    let x = Math.floor(event.offsetX / cellSize);
    let y = Math.floor(event.offsetY / cellSize);
    x = Math.min(Math.max(x, 0), boardSize - 1);
    y = Math.min(Math.max(y, 0), boardSize - 1);
    console.log('mouse clicked',x, y);
    handleCellClick(x, y);
});

function drawBoard() {
    ctx.beginPath();
    for (let i = 0; i <= boardSize -1; i++) {
        ctx.moveTo(i * cellSize + cellSize/2, cellSize/2);
        ctx.lineTo(i * cellSize + cellSize/2, boardSize * cellSize - cellSize/2);
        ctx.moveTo(cellSize/2, i * cellSize + cellSize/2);
        ctx.lineTo(boardSize * cellSize - cellSize/2, i * cellSize + cellSize/2);
    }
    //grey lines
    ctx.strokeStyle = '#969696';
    ctx.stroke();
}

function drawPiece(x, y, color) {
    //console.log(x, y, color);
    ctx.beginPath();
    ctx.arc((x + 0.5) * cellSize, (y + 0.5) * cellSize, cellSize / 2 - 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fill();
}

function renderBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j]) {
                drawPiece(i, j, board[i][j] === 'player1' ? 'black' : 'white');
            }
        }
    }
}



// UI functions
function resetStatus() {
    //clear the board
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
    currentPlayer = null;
    assignedPlayer = null;
    isAI = false;
    hasMoved = false;
    isGameOver = false;
}

function returnToMenu() {
    socket.emit('leaveGame');
    showMenu();
    resetStatus();
}


function showMenu() {
    document.getElementById('gameTitle').style.display = 'none';
    document.querySelector('.game-controls').style.display = 'none';
    canvas.style.display = 'none';
    document.querySelector('.menu').style.display = 'block';
    document.getElementById('welcomeMessage').style.display = 'block';
    document.getElementById('gameStatus').style.display = 'none';
}

function showGame() {
    document.querySelector('.menu').style.display = 'none';
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('gameTitle').style.display = 'block';
    document.querySelector('.game-controls').style.display = 'block';
    canvas.style.display = 'block';
    document.getElementById('gameStatus').style.display = 'block';
    if (isAI) {
        document.getElementById('gameStatus').textContent = 'Your turn';
    } else {
        document.getElementById('gameStatus').textContent = 'Waiting for other player...';
    }
}

renderBoard();
