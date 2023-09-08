const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const cellSize = 20;
let board = Array(19).fill(null).map(() => Array(19).fill(null));
const ws = new WebSocket('ws://localhost:3000');

canvas.addEventListener('click', (e) => {
    const x = Math.floor(e.offsetX / cellSize);
    const y = Math.floor(e.offsetY / cellSize);
    //Send move to server and check if it's valid
    ws.send(JSON.stringify({ type: 'move', x, y }));
});

function drawBoard() {
    for (let i = 0; i < 19; i++) {
        for (let j = 0; j < 19; j++) {
            ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }
}

drawBoard();
