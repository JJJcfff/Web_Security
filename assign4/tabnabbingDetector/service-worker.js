import resemble from '/module/resemblejs';
chrome.alarms.create('screenshot', {periodInMinutes: 1});
// take screenshot every minute for active tab.
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'screenshot') {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tabID = tabs[0].id;
            screenshotTab(tabID);
        });
    }
});

let currentWindowId = null;
let currentTabId = null;
let previousTabId = null;
// take screenshot for a tab that has just been unfocused.
chrome.tabs.onActivated.addListener(activeInfo => {
    currentTabId = activeInfo.tabId;
    currentWindowId = activeInfo.windowId;
});
chrome.windows.onFocusChanged.addListener(windowId => {
    currentWindowId = windowId;
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // All Chrome windows have lost focus
        handleUnfocusedTab();
    } else {
        // Check if the active tab in the current window is our tab of interest
        chrome.tabs.query({active: true, windowId: windowId}, tabs => {
            if (tabs.length > 0 && tabs[0].id !== currentTabId) {
                previousTabId = tabs[0].id;
                handleUnfocusedTab();
            }
        });
    }
});

function handleUnfocusedTab() {
    if (currentTabId !== null && currentWindowId !== null) {
        screenshotTab(previousTabId);
    }
}

chrome.tabs.onActivated.addListener(activeInfo => {
    // take a screenshot for the tab that has just been activated and compare with previous.
    let tabID = activeInfo.tabId;
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function (image) {
        compareImage(tabID, image, 16, 16).then(comparisonResults => {
            console.log(comparisonResults);
            for (let i = 0; i < comparisonResults.length; i++) {
                if (comparisonResults[i] === 1) {
                    console.log('change detected');
                    updateIcon(true);
                    break;
                }
            }
            chrome.runtime.sendMessage({action: "displayOverlay", data: comparisonResults});
        });
    });
});

chrome.tabs.onRemoved.addListener(tabId => {
    //delete screenshot for tabId
    chrome.storage.local.remove(tabId.toString(), function (){
        console.log('remove image for tab'+tabId + 'time'+ Date.now());
    });
});

function updateIcon(alertFound){
    chrome.browserAction.setIcon({path: alertFound ? 'icon-alert.png' : 'icon-normal.png'});
}

function screenshotTab(tabID) {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function (image) {
        saveImage(tabID, image);
    });
}

function saveImage(tabID, imagePath) {
    let screenshots = {};
    screenshots[tabID] = imagePath;
    chrome.storage.local.set(screenshots, function (){
        console.log('save image for tab'+tabID + 'at'+imagePath + 'time'+ Date.now());
    });
}

//segment image into 16*16 blocks and compare each block with previous image, return an array of ints as blocks, 0 for no change, 1 for change.
//use resemble.js
function compareImage(tabID, imagePath, numRows, numCols) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(tabID.toString(), function (storageResult) {
            let prevImage = new Image();
            let currImage = new Image();

            prevImage.src = storageResult[tabID];
            currImage.src = imagePath;

            prevImage.onload = () => {
                currImage.onload = () => {
                    let prevBlocks = splitImage(prevImage, numRows, numCols);
                    let currBlocks = splitImage(currImage, numRows, numCols);
                    let comparisonPromises = [];

                    for (let i = 0; i < prevBlocks.length; i++) {
                        let promise = new Promise((res, rej) => {
                            resemble(prevBlocks[i]).compareTo(currBlocks[i]).onComplete(function (data) {
                                let diff = data.misMatchPercentage;
                                res(diff > 0.1 ? 1 : 0);
                            });
                        });

                        comparisonPromises.push(promise);
                    }

                    Promise.all(comparisonPromises).then(comparisonResults => {
                        resolve(comparisonResults);
                    }).catch(reject);
                };
            };
            currImage.onerror = reject;
            prevImage.onerror = reject;
        });
    });
}


function splitImage(image, numRows, numCols) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let width = image.width;
    let height = image.height;
    let blockWidth = Math.floor(width / numCols);
    let blockHeight = Math.floor(height / numRows);
    let blocks = [];
    ctx.drawImage(image, 0, 0);
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++){
            let block = ctx.getImageData(j * blockWidth, i * blockHeight, blockWidth, blockHeight);
            blocks.push(block);
        }
    }
    return blocks;
}

