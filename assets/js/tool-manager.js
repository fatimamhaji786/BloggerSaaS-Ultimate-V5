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

// ===========================================
// Tool Manager V5 - Save Tool
// ===========================================

const saveToolBtn = document.getElementById("saveToolBtn");

if(saveToolBtn){

saveToolBtn.onclick = function(){

const name =
document.getElementById("toolName").value;

const category =
document.getElementById("toolCategory").value;

const url =
document.getElementById("toolURL").value;

const description =
document.getElementById("toolDescription").value;

if(name=="" || category==""){

alert("Please enter Tool Name and Category.");

return;

}

const toolGrid =
document.getElementById("toolGrid");

const card =
document.createElement("div");

card.className = "tool-card";

card.innerHTML = `

<h3>${name}</h3>

<p>
Category: ${category}
</p>

<p>
${description}
</p>

<button>✏️ Edit</button>

<button class="delete">
🗑️ Delete
</button>

`;

toolGrid.appendChild(card);

  updateToolCounter();

// Clear form

document.getElementById("toolName").value="";

document.getElementById("toolCategory").value="";

document.getElementById("toolURL").value="";

document.getElementById("toolDescription").value="";

// Close popup

modal.style.display="none";

};

}

// ===========================================
// Tool Manager V5 - Live Counter
// ===========================================

function updateToolCounter(){

const total =
document.querySelectorAll(".tool-card").length;

document.getElementById("totalTools").innerHTML = total;

}

updateToolCounter();

// ===========================================
// Tool Manager V5 - Search
// ===========================================

const searchTool = document.getElementById("searchTool");

if(searchTool){

searchTool.addEventListener("keyup", function(){

const value = this.value.toLowerCase();

const cards =
document.querySelectorAll(".tool-card");

cards.forEach(card=>{

const text =
card.innerText.toLowerCase();

if(text.includes(value)){

card.style.display = "block";

}else{

card.style.display = "none";

}

});

});

}

// ===========================================
// Tool Manager V5 - Edit Button
// ===========================================

const editButtons =
document.querySelectorAll(".edit-btn");

editButtons.forEach(button=>{

button.addEventListener("click",function(){

modal.style.display="block";

});

});
