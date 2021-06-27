var socket = io();
if(!localStorage.getItem("userToken")) {
    location = "logup";
} else {
    socket.emit("checktoken", localStorage.getItem("userToken"), function (result) {
        console.log(result)
        if(!result){
            localStorage.clear()
            location = "logup"
        }
    });
}
document.querySelector(".findinterns").onclick = function (){
    location = "/search?q=Johhny Appleseed";
};
document.querySelector(".applyforinternships").onclick = function () {
    location = "/edit";
};