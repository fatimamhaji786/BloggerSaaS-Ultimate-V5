// ===========================================
// Firebase Configuration
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyBJLJTKsM3wjYZFx9je2tAtxs4zPQu_7e8",
  authDomain: "bloggersaas-v1.firebaseapp.com",
  databaseURL: "https://bloggersaas-v1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bloggersaas-v1",
  storageBucket: "bloggersaas-v1.firebasestorage.app",
  messagingSenderId: "187643103324",
  appId: "1:187643103324:web:e5070919496c09a277be99"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Realtime Database
const database = firebase.database();

document.addEventListener("DOMContentLoaded", () => {

console.log("Tool Manager Loaded");

});

// ===========================================
// Tool Manager V5 - Edit Mode
// ===========================================

let currentEditingCard = null;

let currentEditingKey = null;

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

  // If editing an existing tool
if(currentEditingKey){

database.ref("tools/" + currentEditingKey).update({

name: name,
category: category,
url: url,
description: description

});

currentEditingKey = null;
currentEditingCard = null;

modal.style.display = "none";

document.getElementById("toolName").value = "";
document.getElementById("toolCategory").value = "";
document.getElementById("toolURL").value = "";
document.getElementById("toolDescription").value = "";

return;

  }

  updateToolCounter();

  database.ref("tools").push({
  name: name,
  category: category,
  url: url,
  description: description
});

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

document.addEventListener("click", function(e){

if(e.target.classList.contains("edit-btn")){

currentEditingCard =
e.target.closest(".tool-card");

currentEditingKey =
currentEditingCard.dataset.key;

document.getElementById("toolName").value =
currentEditingCard.querySelector("h3").innerText;

document.getElementById("toolCategory").value =
currentEditingCard.querySelector("p")
.innerText.replace("Category: ","");

document.getElementById("toolDescription").value =
currentEditingCard.querySelectorAll("p")[1].innerText;

modal.style.display = "block";

}

});

// ===========================================
// Tool Manager V5 - Delete Button
// ===========================================

document.addEventListener("click", function(e){

if(e.target.classList.contains("delete-btn")){

if(confirm("Delete this tool?")){

const card = e.target.closest(".tool-card");

const key = card.dataset.key;

database.ref("tools/" + key).remove();

}

}

});

// ===========================================
// Load Tools from Firebase
// ===========================================

database.ref("tools").on("value", function(snapshot){

const toolGrid = document.getElementById("toolGrid");

toolGrid.innerHTML = "";

snapshot.forEach(function(child){

const tool = child.val();

const key = child.key;

const card = document.createElement("div");

card.className = "tool-card";

card.dataset.key = key;
  
card.innerHTML = `
<h3>${tool.name}</h3>

<p>Category: ${tool.category}</p>

<p>${tool.description}</p>

<button class="edit-btn">✏️ Edit</button>

<button class="delete-btn delete">🗑️ Delete</button>
`;

toolGrid.appendChild(card);

});

updateToolCounter();

});
