
let lastActiveTabId = null;
// take screenshot every 15s for current active tab.
chrome.alarms.create('screenshot', {
        when: Date.now(),
        periodInMinutes: 1/12
    }).then(r => {
        console.log('alarm created');
});
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'screenshot') {
        console.log('alarm received, take screenshot');
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            if (tabs.length === 0) {
                console.log('no active tab');
                return;
            }
            screenshotTab(tabs[0].id);
            console.log('alarm triggered take screenshot for tab'+ tabs[0].id + 'time: '+ Date.now());
        })
    }
});

//inject content script for every tab
chrome.tabs.onCreated.addListener(function(tab) {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['content.js']
    }).then(r =>{
        console.log('content script injected for tab'+tab.id + 'time'+ Date.now());
    });
});


chrome.tabs.onActivated.addListener(activeInfo => {
    updateIcon(false);
    setTimeout(() => { //wait for 500ms to take screenshot
        console.log('tab activated');
        if (lastActiveTabId !== null && lastActiveTabId !== activeInfo.tabId) {
            console.log(`Tab ${lastActiveTabId} lost focus`);
            screenshotTab(lastActiveTabId);
            //get previous screenshot for current tab
            chrome.storage.local.get(activeInfo.tabId.toString(), function (prevImage) {
                if (prevImage === undefined) {
                    console.log('previous image not found');
                    return;
                }
                //get current screenshot for current tab
                chrome.tabs.captureVisibleTab(null, {format: 'png'}, function (currImage) {
                    //:TODO: compare two images
                    // resemble(prevImage[activeInfo.tabId]).compareTo(currImage).onComplete(function (data) {
                    //     let diff = data.misMatchPercentage;
                    //     console.log('diff: ' + diff);
                    //     if (diff > 0.1) {
                    //         console.log('change detected');
                    //         updateIcon(true);
                    //     }
                    //     else {
                    //         console.log('no change');
                    //         updateIcon(false);
                    //     }
                    // });
                    console.log('compare image for tab'+activeInfo.tabId + 'time'+ Date.now());
                    let imageCompResult = {};
                    imageCompResult["nRows"] = 16;
                    imageCompResult["nCols"] = 16;
                    let blockData = [];
                    for (let i = 0; i < 16*16; i++) {
                        if (Math.random() < 0.3) {
                            blockData.push(1);
                        }
                        else {
                            blockData.push(0);
                        }
                    }
                    imageCompResult["data"] = blockData;
                    tabModified(activeInfo.tabId, imageCompResult);
                });
            });
        } else if (lastActiveTabId === null) {
            console.log(`Tab ${activeInfo.tabId} is the first tab`);
        }
        lastActiveTabId = activeInfo.tabId;
    }, 500);
});


chrome.tabs.onRemoved.addListener(tabId => {
    //delete screenshot for tabId
    console.log('remove image for tab'+tabId + 'time'+ Date.now());
    chrome.storage.local.remove(tabId.toString(), function (){
        console.log('remove image for tab'+tabId + 'time'+ Date.now());
    });
});

//clear all images when browser is closed
chrome.windows.onRemoved.addListener(windowId => {
    chrome.storage.local.clear(function (){
        console.log('clear all images');
    });
});

function tabModified(tabId, imageCompResult) {
    chrome.tabs.sendMessage(tabId, {action: "displayOverlay", data: imageCompResult}).then(r => {
        console.log('send message to content script');
        updateIcon(true);
    }).catch(e => {
        console.log(e);
        console.log('error sending message to content script');
    });

}

function updateIcon(alertFound){
    console.log('update icon');
    chrome.action.setIcon({path: alertFound ? 'icon-alert.png' : 'icon-normal.png'}).then(r => {
        console.log('icon updated');
    });
}

function screenshotTab(tabID) {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function (image) {
        saveImage(tabID, image);
    });
}

function saveImage(tabID, imageDataURL) {
    let screenshots = {};
    screenshots[tabID] = imageDataURL;
    chrome.storage.local.set(screenshots, function (){
        console.log('save image for tab'+tabID + ' time: '+ Date.now());
    });
}

function compareImage(tabID, imageDataURL, numRows, numCols) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(tabID.toString(), function (storageResult) {
            let prevImage = new Image();
            let currImage = new Image();

            prevImage.src = storageResult[tabID];
            currImage.src = imageDataURL;

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

