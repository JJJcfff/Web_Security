//toggle overlay on button click
document.getElementById('toggleOverlay').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggleOverlay"}).then(r => {
            console.log('send message to content script');
        }).catch(e => {
            console.log(e);
            console.log('error sending message to content script');
        });
    });
});