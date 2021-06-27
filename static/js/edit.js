const socket = io();
var tags = [[]];
var skilltags = [];
if(!localStorage.getItem("userToken")) {
    location = "logup";
} else {
    socket.emit("checktoken", localStorage.getItem("userToken"), function (result) {
        if(!result){
            localStorage.clear();
            location = "logup";
        };
    });
    socket.emit("getpdata", localStorage.getItem("userToken"), function (result) {
        document.getElementById("name").value = result.name;
        document.querySelector("img.portfolioheaderpfp").src = result.pfp;
        document.getElementById("age").value = result["bday"];
        document.getElementById("biotextarea").value = result.bio;
        for(i=0;i<result.skills.length;i++){
            createTag(result.skills[i], document.querySelector("div.tagscontainer"),tags,0);
        };
        if(result["education"].length == 0) {
            edububble();
        } else {
            for(var i = 0; i < result["education"].length; i++){
                var information = result.education[i];
                edububble(information["inst"], information["first"], information["last"]);
            }; 
        };
        for(i = 0; i < result.resume.length; i ++){
            createProj(result.resume[i].tags,result.resume[i].title,result.resume[i].descr,i);
        };
        if (result.resume.length == 0){
            createProj([],"","",0);
        }
    });
};
function edububble(inst, first, last){
    var gbr = document.createElement('gbr');
    var dash = document.createElement("h1");
    dash.innerText = "—";
    dash.className = "nospace";
    dash.style["color"] = "var(--matteblack)";
    dash.style["display"] = "inline-block";
    dash.style["margin-right"] = "2vh";
    var input = document.createElement("input");
    input.style["width"] = "25vw";
    input.style["display"] = "inline-block";
    input.placeholder = "Institution";
    input.id = "instituteinput";
    if (inst) {
        input.value = inst;
    };
    input.style["margin-right"] = "1vh";
    var inputyear = document.createElement("input");
    inputyear.setAttribute("type", "number");
    inputyear.setAttribute("placeholder", "First Year");
    inputyear.setAttribute("style", "width: 15vh; display: inline-block; margin-right: 1vh;");
    inputyear.id = "firstinput"
    if (first) {
        inputyear.value = first;
    };
    var inputstop = document.createElement("input");
    inputstop.setAttribute("type", "number");
    inputstop.setAttribute("placeholder", "Last Year");
    inputstop.setAttribute("style", "width: 15vh; display: inline-block;");
    inputstop.id = "stopinput";
    if (last) {
        inputstop.value = last;
    };
    document.getElementById("edutainer").appendChild(gbr);
    document.getElementById("edutainer").appendChild(dash);
    document.getElementById("edutainer").appendChild(input);
    document.getElementById("edutainer").appendChild(inputyear);
    document.getElementById("edutainer").appendChild(inputstop);
};
document.querySelector('button.plus').addEventListener("click", function (){
    edububble();
});
document.getElementById("savechanges").addEventListener("click", function (){
    var institutearr = [];
    document.querySelectorAll("#instituteinput").forEach(function (institute){
        institutearr.push({inst: institute.value});
    });
    var i = 0;
    document.querySelectorAll("#firstinput").forEach(function (first) {
        institutearr[i].first = first.value;
        i++;
    });
    var i = 0;
    document.querySelectorAll("#stopinput").forEach(function (last) {
        institutearr[i].last = last.value;
        i++;
    });
    var projects = [];
    document.querySelectorAll("carouselcard").forEach(function (carouselcard){
        var i = carouselcard.getAttribute("cidentifier");
        var object = {
            title: document.getElementById("cardtitle"+i).value,
            descr: document.getElementById("carddesc"+i).value,
            tags: skilltags[i]
        }
        projects.push(object);
    })
    var conf = {
        bio: document.getElementById("biotextarea").value,
        education: institutearr,
        name: document.getElementById("name").value,
        birthdate: document.getElementById("age").value,
        skills: tags[0],
        resume: projects
    };
    socket.emit("pfchange", localStorage.getItem("userToken"), conf, function (result) {
        console.log(result);
    });
});
document.getElementById("skillstaginput").addEventListener("keypress",function(e){
    if(e.keyCode == 13 && document.getElementById("skillstaginput").value != ""){
        createTag(document.getElementById("skillstaginput").value, document.querySelector("div.tagscontainer"), tags,0);
        document.getElementById("skillstaginput").value = "";
    };
});
document.querySelectorAll("carouselcard #projectskillinput").forEach(function (input){
    input.addEventListener("keypress",function (e){
        if (e.keyCode == 13 && input.value != "") {
            var attribute = input.getAttribute("i");
            createTag(input.value,document.getElementById("projectskillscontainer"+attribute),[]);
            input.value = "";
        };
    })
    
});
function createProj(tags, name, descr, i) {
    var gbr = document.createElement("gbr");
    var gbr2 = document.createElement("gbr");
    var container = document.querySelector("#carouselcontainer");
    var card = document.createElement("carouselcard");
    card.setAttribute("class", "centercontent");
    card.setAttribute("cidentifier",i)
    var header = document.createElement("carouselheader");
    var titleinput = document.createElement("input");
    titleinput.setAttribute("class", "centered opaqueinput white centercontent")
    titleinput.style["width"] = "60%";
    titleinput.id = "cardtitle"+i;
    titleinput.placeholder = "Title"
    if(name !== "") {
        titleinput.value = name;
    }
    header.appendChild(titleinput);
    var description = document.createElement("textarea");
    description.setAttribute("class", "opaquetextarea");
    description.id = "carddesc"+i;
    description.setAttribute("placeholder", "Description")
    if(descr !== ""){
        description.value = descr;
    }
    var tagcontainer = document.createElement("div");
    tagcontainer.setAttribute("class","nospace projectskillscontainer");
    tagcontainer.id = "projectskillscontainer" + i;
    var skillinput = document.createElement("input");
    skillinput.id = "projectskillinput";
    skillinput.setAttribute("i", i);
    skillinput.setAttribute("class", "skillinputfproj");
    skillinput.setAttribute("placeholder", "Skills Required");
    skillinput.addEventListener("keypress", function (e) {
        if (e.keyCode == 13) {
            createTag(skillinput.value, tagcontainer, skilltags, i);
            skillinput.value = "";
        }
    })
    skilltags[i] = [];
    for (e = 0; e < tags.length; e++) {
        createTag(tags[e], tagcontainer, skilltags, i);
    }
    card.appendChild(header);
    card.appendChild(gbr);
    card.appendChild(description);
    card.appendChild(gbr2);
    card.appendChild(tagcontainer);
    card.appendChild(skillinput);
    container.insertBefore(card, document.querySelector("button.projectadd"));
};
function createTag(name,container,obj,obji){
    var tag = document.createElement("tag");
    tag.innerText = name;
    tag.id = stringlengen(10);
    tag.setAttribute("iname",name);
    obj[obji].push(name);
    var span = document.createElement("span");
    span.innerText = "x";
    span.onclick = function () {
        obj[obji].splice(obj[obji].indexOf(tag.getAttribute("iname")), 1);
        tag.parentElement.removeChild(tag);
    };
    tag.appendChild(span);
    container.appendChild(tag);
};
document.querySelector("button.projectadd").addEventListener("click", function(){
    createProj([], "", "", skilltags.length);
    skilltags.push([]);
})
function stringlengen(length){
    var letters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    var string = "";
    for(i=0;i<length;i++){
        string += letters[Math.round(Math.random()*(letters.length-1))]
    }
    return string;
}