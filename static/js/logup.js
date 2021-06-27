var socket = io();
if (localStorage.getItem("userToken")) {
    location = "/"
}
document.getElementById("sidebarbutton2").addEventListener("click", function (e) {
    document.querySelector('textarea#logupportiontrigger').value = "";
})
document.getElementById("sidebarbutton").addEventListener("click", function (e) {
    document.querySelector('textarea#logupportiontrigger').value = "a";
});
document.getElementById("submits").addEventListener("click", function (e) {
    var fullname = document.getElementById("names").value;
    var email = document.getElementById("emails").value;
    var password = document.getElementById("passwords").value;
    socket.emit('signup', fullname, email, password, function (result) {
        if(result[0]) {
            localStorage.setItem("userToken", result[1]);
            location = "/";
        }
    })
});
document.querySelectorAll(".logupportion2 .lupl input").forEach(function (input){
    input.addEventListener("keypress",function(e){
        if(e.keyCode == 13){
            document.getElementById("submits").click();
        }
    })
})
document.getElementById("submitl").addEventListener("click", function (e) {
    var email = document.getElementById("emaill").value;
    var password = document.getElementById("passwordl").value;
    socket.emit('login', email, password, function (result) {
        if (result[0]) {
            localStorage.setItem("userToken", result[1]);
            location = "/home";
        } else {
            console.log(result[1]);
        }
    })
});
document.querySelectorAll(".logupportion2 .lupr input").forEach(function (input) {
    input.addEventListener("keypress", function (e) {
        if (e.keyCode == 13) {
            document.getElementById("submitl").click();
        }
    })
})