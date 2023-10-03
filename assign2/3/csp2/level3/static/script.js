function chooseTab(num) {
    // Dynamically load the appropriate image.
    var html = "Image " + parseInt(num) + "<br>";
    html += "<img src='/static/level3/cloud" + num + ".jpg' />";
    $('#tabContent').html(html);

    window.location.hash = num;

    // Select the current tab
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].id == "tab" + parseInt(num)) {
            tabs[i].className = "tab active";
        } else {
            tabs[i].className = "tab";
        }
    }
}
window.onload = function () {
  document.getElementById("tab1").onclick = function () {
    chooseTab(1);
  };
  document.getElementById("tab2").onclick = function () {
    chooseTab(2);
  };
  document.getElementById("tab3").onclick = function () {
    chooseTab(3);
  };
  chooseTab(unescape(self.location.hash.substr(1)) || "1");
};