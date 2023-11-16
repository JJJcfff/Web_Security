document.addEventListener('DOMContentLoaded', function() {

});

function showAlert(message) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
}

chrome.runtime.sendMessage({ action: "getStatus" }, function(response) {
    // TODO
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "updateAlert") {
        showAlert(request.message);
    }
});
