const socket = io();
var uuid = document.getElementById("uuid").value;
document.getElementById("backbutton").setAttribute("href", document.referrer)
document.getElementById("backbutton").onclick = function() {
    history.back();
    return false;
  }
socket.emit("getpfdata", uuid, localStorage.getItem("userToken"), function (msg){
    document.getElementById("name").innerText = msg.name+ ", ";
    document.getElementById("age").innerText = msg.bday;
    document.getElementById("bio").innerText = msg.bio;
    document.querySelector("img.portfolioheaderpfp").src = msg.pfp
    document.getElementById("contact").addEventListener("click",function (){
        socket.emit("checkedemail",uuid,localStorage.getItem("userToken"));
        location = `mailto: ${msg.email}`
    })
    for(i=0;i<msg.resume.length;i++){
        var card = document.createElement("carouselcard");
        var header = document.createElement("carouselheader");
        var title = document.createElement("h1");
        title.setAttribute("class", "nospace centered white");
        title.innerText = msg.resume[i].title;
        header.appendChild(title);
        var body = document.createElement("pre");
        body.innerText = msg.resume[i].descr;
        card.appendChild(header);
        card.appendChild(body);
        document.querySelector(".carouselcontainer").appendChild(card);
    }
    for (i=0; i<msg.education.length; i++) {
        var dash = document.createElement("h1");
        var info = document.createElement("h1");
        var gbr = document.createElement("gbr");
        document.getElementById("edutainer").appendChild(dash);
        dash.setAttribute("class", "nospace");
        dash.setAttribute("style", "margin-right: 2vh; display:inline-block;");
        dash.innerText = "—";
        info.setAttribute("class", "nospace");
        info.setAttribute("style", "margin-right: 1vh; display:inline-block;font-family: light; font-size: 4vh");
        info.innerText = `${msg.education[i]["inst"]}: ${msg.education[i]["first"]} - ${msg.education[i]["last"]}`;
        document.getElementById("edutainer").appendChild(dash);
        document.getElementById("edutainer").appendChild(info);
        document.getElementById("edutainer").appendChild(gbr);
    }
});