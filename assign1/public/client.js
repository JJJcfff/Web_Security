const boardSize = 15;
const cellSize = 30;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
let currentPlayer = null;
const socket = io.connect('http://localhost:3000');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.addEventListener('click', (event) => {
    const x = Math.floor(event.offsetX / cellSize);
    const y = Math.floor(event.offsetY / cellSize);
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

function renderBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j]) {
                drawPiece(i, j, board[i][j]);
            }
        }
    }
}

function unHideCanvas() {
    canvas.style.display = 'block';
}

function clearBoard() {
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
    renderBoard();
}

function handleCellClick(x, y) {
    if (!board[x][y]) {
        board[x][y] = currentPlayer;
        socket.emit('makeMove', { x, y, player: currentPlayer });
        renderBoard();
    }
}

function returnToMenu() {
    socket.emit('leaveGame');
    document.querySelector('.menu').style.display = 'block';
    document.getElementById('gameTitle').style.display = 'none';
    document.querySelector('.game-controls').style.display = 'none';
    document.getElementById('welcomeMessage').style.display = 'block';
    canvas.style.display = 'none';
    clearBoard();
}

function startGame(mode) {
    document.querySelector('.menu').style.display = 'none';
    document.getElementById('welcomeMessage').style.display = 'none';
    clearBoard();
    const gameTitle = document.getElementById('gameTitle');
    if (mode === 'ai') {
        gameTitle.textContent = 'Playing against AI';
        socket.emit('ai');
    } else {
        gameTitle.textContent = 'Playing against Human. You are ' + assignedColor;
    }
    gameTitle.style.display = 'block';
    document.querySelector('.game-controls').style.display = 'block';
    unHideCanvas();
    renderBoard();
}

socket.on('moveMade', (data) => {
    board[data.x][data.y] = data.player;
    currentPlayer = data.player === 'player1' ? 'player2' : 'player1';
    renderBoard();
});

socket.on('assignColor', (color) => {
    assignedColor = color;
});

socket.on('error', (message) => {
    alert(message);
});

socket.on('userDisconnected', () => {
    alert('Other player disconnected');
    returnToMenu();
});

renderBoard();
