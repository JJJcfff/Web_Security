chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "displayOverlay") {
        clearOverlay();
        const overlay = createOverlay();
        displayDifferences(overlay, request.data);
    }
    else if (request.action === "toggleOverlay") {
        toggleOverlay();
    }
    else if (request.action === "clearOverlay") {
        clearOverlay();
    }
});

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '1000';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';

    document.body.appendChild(overlay);
    return overlay;
}

function displayDifferences(overlay, data) {
    console.log('display differences');
    console.log(data);
    let nRows = data["nRows"];
    let nCols = data["nCols"];
    let blockData = data["data"];
    for (let i = 0; i < nRows*nCols; i++) {
        if (blockData[i] === 1) {
            const diffElement = document.createElement('div');
            diffElement.style.position = 'absolute';
            diffElement.style.left = `${i%nCols*100/nCols}%`;
            diffElement.style.top = `${Math.floor(i/nCols)*100/nRows}%`;
            diffElement.style.width = `${100/nCols}%`;
            diffElement.style.height = `${100/nRows}%`;
            diffElement.style.backgroundColor = 'red';
            diffElement.style.opacity = '0.4';
            overlay.appendChild(diffElement);
        }
    }
    // differences.forEach(diff => {
    //     const diffElement = document.createElement('div');
    //     diffElement.style.position = 'absolute';
    //     diffElement.style.left = `${diff.x}px`;
    //     diffElement.style.top = `${diff.y}px`;
    //     diffElement.style.width = `${diff.width}px`;
    //     diffElement.style.height = `${diff.height}px`;
    //     diffElement.style.backgroundColor = 'red';
    //     diffElement.style.opacity = '0.5';
    //
    //     overlay.appendChild(diffElement);
    // });
}

function clearOverlay() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.remove();
    }
}

function toggleOverlay() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
    }
}