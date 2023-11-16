chrome.tabs.onActivated.addListener(activeInfo => {
    //TODO
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    //TODO
});

function screenshotTab(tabID) {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
        let screenshots = {};
        screenshots[tabID] = dataUrl;

        chrome.storage.local.set(screenshots, function (){
            console.log('screenshot tab'+tabID);
        });
    });
}