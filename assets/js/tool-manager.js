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
