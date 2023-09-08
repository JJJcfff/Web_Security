const boardSize = 15;
const cellSize = 30;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
let currentPlayer = null;
let assignedPlayer = null;
const socket = io.connect('http://localhost:3000');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// socket events
socket.on('assign', (player) => {
    assignedPlayer = player;
    if (player === 'player1') {
        currentPlayer = 'player1';
    }
});

socket.on('userDisconnected', () => {
    alert('player disconnected');
    returnToMenu();
});

// canvas functions
canvas.addEventListener('click', (event) => {
    const x = Math.round(event.offsetX / cellSize);
    const y = Math.round(event.offsetY / cellSize);
    handleCellClick(x, y);
});

function drawBoard() {
    for (let i = 0; i <= boardSize; i++) {
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, boardSize * cellSize);
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(boardSize * cellSize, i * cellSize);
    }
    ctx.strokeStyle = '#000';
    ctx.stroke();
}

function drawPiece(x, y, color) {
    ctx.beginPath();
    ctx.arc((x + 0.5) * cellSize, (y + 0.5) * cellSize, cellSize / 2 - 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function handleCellClick(x, y) {
    // if (!board[x][y] && currentPlayer === assignedPlayer) {
    //     board[x][y] = assignedPlayer;
    //     socket.emit('makeMove', {x, y, player: assignedPlayer});
    //     renderBoard();
    // }
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


function resetStatus() {
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
    currentPlayer = null;
    assignedPlayer = null;
}

function returnToMenu() {
    showMenu();
    resetStatus();
    socket.emit('leaveGame');
}

function startGame(mode) {
    const gameTitle = document.getElementById('gameTitle');
    if (mode === 'ai') {
        gameTitle.textContent = 'Playing against AI';
        socket.emit('ai');
    } else {
        gameTitle.textContent = 'Playing against Human. You are ' + assignedColor;
        socket.emit('human');
    }
    showGame();
    renderBoard();
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
}

renderBoard();
