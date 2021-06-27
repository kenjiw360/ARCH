document.getElementById("mainsearch").addEventListener("keypress",function (e){
    if(e.key == "Enter" && document.getElementById("mainsearch").value != ""){
        location = `/search?${document.getElementById("mainsearch").getAttribute("kindofsearch")}=${document.getElementById("mainsearch").value}`;
    }
});
document.getElementById("s/n").addEventListener("change", function (e) {
    if(e.target.value == "q"){
        document.getElementById("mainsearch").setAttribute("placeholder", `Search by name...`)
    }else{
        document.getElementById("mainsearch").this.setAttribute("placeholder", "Search by skill...")
    }
    document.getElementById("mainsearch").setAttribute("kindofsearch", e.target.value)
})