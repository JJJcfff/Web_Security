function startTimer(seconds) {
    seconds = parseInt(seconds) || 3;
    setTimeout(function () {
        window.confirm("Time is up!");
        window.history.back();
    }, seconds * 1000);
}

window.onload = function () {
    startTimer('{{ timer }}');
}


