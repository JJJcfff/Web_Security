chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "displayOverlay") {
        const overlay = createOverlay();
        displayDifferences(overlay, request.data);
    }
});

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'my-extension-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '1000';
    overlay.style.pointerEvents = 'none'; // So it doesn't block interaction with the page
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black

    document.body.appendChild(overlay);
    return overlay;
}

function displayDifferences(overlay, differences) {
    differences.forEach(diff => {
        const diffElement = document.createElement('div');
        diffElement.style.position = 'absolute';
        diffElement.style.left = `${diff.x}px`;
        diffElement.style.top = `${diff.y}px`;
        diffElement.style.width = `${diff.width}px`;
        diffElement.style.height = `${diff.height}px`;
        diffElement.style.backgroundColor = 'red';
        diffElement.style.opacity = '0.5';

        overlay.appendChild(diffElement);
    });
}



