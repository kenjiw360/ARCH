document.querySelectorAll("button").forEach(function (button) {
    button.addEventListener("focus", function () {
        setTimeout(function () {
            button.blur()
        }, 300)
    })
});