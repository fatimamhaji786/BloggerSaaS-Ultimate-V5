document.addEventListener("DOMContentLoaded", () => {

console.log("Tool Manager Loaded");

});

// ===========================================
// Tool Manager V5 - Popup
// ===========================================

const modal = document.getElementById("toolModal");

const addToolBtn = document.getElementById("addToolBtn");

const closeBtn = document.querySelector(".close");

if(addToolBtn){

addToolBtn.onclick = function(){

modal.style.display = "block";

};

}

if(closeBtn){

closeBtn.onclick = function(){

modal.style.display = "none";

};

}

window.onclick = function(event){

if(event.target == modal){

modal.style.display = "none";

}

};
