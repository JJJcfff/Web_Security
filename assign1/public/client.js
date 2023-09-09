const boardSize = 15;
const cellSize = 30;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
const socket = io.connect('http://localhost:3000');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentPlayer = 'player1';
let assignedPlayer = null;
let isAI = false;

// socket events
socket.on('assign', (player) => {
    assignedPlayer = player;
    document.getElementById('gameTitle').textContent = 'Playing against Human. You are ' + assignedPlayer;
});
socket.on('beginGame', () => {
    if (assignedPlayer === 'player1') {
        document.getElementById('gameStatus').textContent = 'Your turn';
    } else {
        document.getElementById('gameStatus').textContent = 'Opponent\'s turn';
    }
});
socket.on('moveMade', (data) => {
    board[data.x][data.y] = data.player;
    renderBoard();
    switchPlayer();
});
socket.on('error', (message) => {
    alert(message);
    returnToMenu();
});
socket.on('gameOver', (message) => {
    alert(message);
});




// game logic
function handleCellClick(x, y) {
    if(!board[x][y] && assignedPlayer === currentPlayer) {
        socket.emit('makeMove', {x, y});
    }
}

function checkWin() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize - 4; j++) {
            if (board[i][j] && board[i][j] === board[i][j + 1] && board[i][j] === board[i][j + 2] && board[i][j] === board[i][j + 3] && board[i][j] === board[i][j + 4]) {
                return board[i][j];
            }
        }
    }
    return null;
}

function startGame(mode) {
    const gameTitle = document.getElementById('gameTitle');
    if (mode === 'ai') {
        gameTitle.textContent = 'Playing against AI';
        isAI = true;
        socket.emit('ai');
    } else {
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
    const x = Math.floor(event.offsetX / cellSize);
    const y = Math.floor(event.offsetY / cellSize);
    console.log(x, y);
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
    ctx.strokeStyle = '#000';
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
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
    currentPlayer = 'player1';
    assignedPlayer = null;
    isAI = false;
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
