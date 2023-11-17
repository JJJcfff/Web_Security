import resemblejs from 'https://cdn.jsdelivr.net/npm/resemblejs@5.0.0/+esm'

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
    chrome.tabs.sendMessage(activeInfo.tabId, {action: "clearOverlay"}).then(r => {
        console.log('send message to content script to clear overlay');
    }).catch(e => {
        console.log(e);
        console.log('error sending message to content script');
    });
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
                    console.log('compare image for tab'+activeInfo.tabId + 'time'+ Date.now());
                    compareImage(activeInfo.tabId, currImage, 16, 16).then(r => {
                        console.log('compare image complete');
                    });
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

async function compareImage(tabID, imageDataURL, numRows, numCols) {
    chrome.storage.local.get(tabID.toString(), async function (storageResult) {
        let prevImage = storageResult[tabID];
        let currImage = imageDataURL;
        if (prevImage === undefined || currImage === undefined) {
            console.log('one of the image not found');
            return;
        }
        console.log('compare image for tab'+tabID + 'time'+ Date.now());
        await splitImage(prevImage, numRows, numCols).then(async prevBlocks => {
            await splitImage(currImage, numRows, numCols).then(currBlocks => {
                console.log("image split complete");
                let imageCompResult = {};
                imageCompResult["nRows"] = numRows;
                imageCompResult["nCols"] = numCols;
                let blockData = [];
                let isTabModified = false;
                for (let i = 0; i < numRows * numCols; i++) {
                   resemblejs(prevBlocks[i].data).compareTo(currBlocks[i].data).onComplete(function (data) {
                        blockData.push(data);
                        if (data["rawMisMatchPercentage"] > 0.1) {
                            isTabModified = true;
                        }
                   });
                }
                imageCompResult["data"] = blockData;
                console.log("compare image: ", imageCompResult);
                if (isTabModified) {
                    console.log('change detected, now go to tabModified');
                    tabModified(tabID, imageCompResult);
                }
            });
        });
    });
}


async function splitImage(imageDataURL, numRows, numCols) {
    const blob = await fetch(imageDataURL).then(r => r.blob());
    const image = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
//set willReadFrequently to true to improve performance


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

