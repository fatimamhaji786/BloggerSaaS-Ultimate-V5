// ==========================================
// BloggerSaaS Ultimate V2
// Tool Manager
// Version 2.0
// ==========================================

// ==========================================
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

// ==========================================
// Initialize Firebase
// ==========================================

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();

// ==========================================
// Global Variables
// ==========================================

let currentEditingKey = null;
let currentEditingCard = null;

const modal = document.getElementById("toolModal");
const toolGrid = document.getElementById("toolGrid");

document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ Tool Manager V2 Loaded");

    updateToolCounter();

    updateCategoryCounter();

    updateActiveCounter();

});

// ==========================================
// Popup Manager
// ==========================================

const modal = document.getElementById("toolModal");

const addToolBtn = document.getElementById("addToolBtn");

const closeBtn = document.querySelector(".close");

// ==========================================
// Open Popup
// ==========================================

function openModal(){

    modal.style.display = "block";

}

// ==========================================
// Close Popup
// ==========================================

function closeModal(){

    modal.style.display = "none";

    clearForm();

    resetEditMode();

}

// ==========================================
// Button Events
// ==========================================

if(addToolBtn){

    addToolBtn.addEventListener("click",function(){

        openModal();

    });

}

if(closeBtn){

    closeBtn.addEventListener("click",function(){

        closeModal();

    });

}

// Click outside popup

window.addEventListener("click",function(e){

    if(e.target===modal){

        closeModal();

    }

});

// ==========================================
// Clear Form
// ==========================================

function clearForm(){

    document.getElementById("toolName").value="";

    document.getElementById("toolCategory").value="";

    document.getElementById("toolURL").value="";

    document.getElementById("toolDescription").value="";

}

// ==========================================
// Reset Edit Mode
// ==========================================

function resetEditMode(){

    currentEditingKey=null;

    currentEditingCard=null;

  
// ==========================================
// Save Tool
// ==========================================

const saveToolBtn = document.getElementById("saveToolBtn");

if (saveToolBtn) {

    saveToolBtn.addEventListener("click", saveTool);

}

function saveTool() {

    const name = document.getElementById("toolName").value.trim();

    const category = document.getElementById("toolCategory").value.trim();

    const url = document.getElementById("toolURL").value.trim();

    const description = document.getElementById("toolDescription").value.trim();

    // ==============================
    // Validation
    // ==============================

    if (name === "") {

        alert("Please enter Tool Name.");

        document.getElementById("toolName").focus();

        return;

    }

    if (category === "") {

        alert("Please enter Tool Category.");

        document.getElementById("toolCategory").focus();

        return;

    }

    const toolData = {

        name: name,

        category: category,

        url: url,

        description: description,

        updatedAt: Date.now()

    };

    // ==============================
    // Edit Existing Tool
    // ==============================

    if (currentEditingKey) {

        database.ref("tools/" + currentEditingKey).update(toolData)

        .then(() => {

            alert("✅ Tool updated successfully.");

            closeModal();

        })

        .catch(error => {

            alert("Error: " + error.message);

        });

        return;

    }

    // ==============================
    // Add New Tool
    // ==============================

    toolData.createdAt = Date.now();

toolData.updatedAt = Date.now();

toolData.active = true;

toolData.featured = false;

    database.ref("tools").push(toolData)

    .then(() => {

        alert("✅ Tool added successfully.");

        closeModal();

    })

    .catch(error => {

        alert("Error: " + error.message);

    });

}

  // ==========================================
// Load Tools from Firebase
// ==========================================

database.ref("tools").on("value", function(snapshot){

    const toolGrid = document.getElementById("toolGrid");

    toolGrid.innerHTML = "";

    let totalTools = 0;

    let categories = new Set();

    let activeTools = 0;

    // No tools available

    if(!snapshot.exists()){

        toolGrid.innerHTML = `

        <div class="empty-state">

            <h2>No Tools Found</h2>

            <p>Click "Add Tool" to create your first tool.</p>

        </div>

        `;

        document.getElementById("totalTools").innerText = "0";

        document.getElementById("totalCategories").innerText = "0";

        document.getElementById("activeTools").innerText = "0";

        return;

    }

    snapshot.forEach(function(child){

        const tool = child.val();

        const key = child.key;

        totalTools++;

        activeTools++;

        categories.add(tool.category);

        const card = document.createElement("div");

        card.className = "tool-card";

        card.dataset.key = key;

        card.dataset.name = tool.name.toLowerCase();

        card.dataset.category = tool.category.toLowerCase();

        card.innerHTML = `

            <h3>${tool.name}</h3>

            <p><strong>Category:</strong> ${tool.category}</p>

            <p><strong>URL:</strong> ${tool.url || "-"}</p>

            <p>${tool.description || ""}</p>

            <div class="tool-actions">

                <button class="edit-btn">

                    ✏️ Edit

                </button>

                <button class="delete-btn delete">

                    🗑️ Delete

                </button>

            </div>

        `;

        toolGrid.appendChild(card);

    });

    document.getElementById("totalTools").innerText = totalTools;

    document.getElementById("totalCategories").innerText = categories.size;

    document.getElementById("activeTools").innerText = activeTools;

});

// ==========================================
// Live Search
// ==========================================

const searchBox = document.getElementById("searchTool");

if(searchBox){

    searchBox.addEventListener("keyup",function(){

        const keyword = this.value.toLowerCase();

        document.querySelectorAll(".tool-card").forEach(function(card){

            const name = card.dataset.name;

            const category = card.dataset.category;

            if(

                name.includes(keyword) ||

                category.includes(keyword)

            ){

                card.style.display = "";

            }

            else{

                card.style.display = "none";

            }

        });

    });

}

card.innerHTML = `

<h3>${tool.name}</h3>

<p><strong>Category:</strong> ${tool.category}</p>

<p><strong>URL:</strong> ${tool.url || "-"}</p>

<p>${tool.description || ""}</p>

<p><strong>Status:</strong>
<span class="${tool.active === false ? 'status-inactive' : 'status-active'}">
${tool.active === false ? "Inactive" : "Active"}
</span>
</p>

<p><strong>Featured:</strong>
${tool.featured ? "⭐ Yes" : "—"}
</p>

<p><strong>Created:</strong>
${tool.createdAt ? new Date(tool.createdAt).toLocaleDateString() : "-"}
</p>

<p><strong>Updated:</strong>
${tool.updatedAt ? new Date(tool.updatedAt).toLocaleDateString() : "-"}
</p>

<div class="tool-actions">

<button class="edit-btn">
✏️ Edit
</button>

<button class="feature-btn">
⭐ Feature
</button>

<button class="status-btn">
${tool.active === false ? "🟢 Activate" : "🔴 Deactivate"}
</button>

<button class="delete-btn delete">
🗑️ Delete
</button>

</div>

`;

   // ==========================================
// Toggle Featured
// ==========================================

document.addEventListener("click",function(e){

if(!e.target.classList.contains("feature-btn")) return;

const card=e.target.closest(".tool-card");

const key=card.dataset.key;

database.ref("tools/"+key).once("value",function(snapshot){

const tool=snapshot.val();

database.ref("tools/"+key).update({

featured: !tool.featured,

updatedAt: Date.now()

});

});

});

  // ==========================================
// Toggle Active / Inactive
// ==========================================

document.addEventListener("click",function(e){

if(!e.target.classList.contains("status-btn")) return;

const card=e.target.closest(".tool-card");

const key=card.dataset.key;

database.ref("tools/"+key).once("value",function(snapshot){

const tool=snapshot.val();

database.ref("tools/"+key).update({

active: !(tool.active===false),

updatedAt: Date.now()

});

});

});

// ===========================================
// Tool Manager V2 - Dashboard Statistics
// ===========================================

function updateDashboardStats() {

database.ref("tools").once("value", function(snapshot){

let totalTools = 0;
let categories = new Set();
let activeTools = 0;

snapshot.forEach(function(child){

const tool = child.val();

totalTools++;

if(tool.category){
categories.add(tool.category);
}

if(tool.status === "Active" || !tool.status){
activeTools++;
}

});

const totalToolsEl = document.getElementById("totalTools");
const totalCategoriesEl = document.getElementById("totalCategories");
const activeToolsEl = document.getElementById("activeTools");

if(totalToolsEl){
totalToolsEl.innerHTML = totalTools;
}

if(totalCategoriesEl){
totalCategoriesEl.innerHTML = categories.size;
}

if(activeToolsEl){
activeToolsEl.innerHTML = activeTools;
}

});

}

// ===========================================
// Refresh Dashboard after Firebase changes
// ===========================================

database.ref("tools").on("value", function(){

updateDashboardStats();

});

// ===========================================
// Search Tools
// ===========================================

const searchInput = document.getElementById("searchTool");

if(searchInput){

searchInput.addEventListener("keyup", function(){

const filter = this.value.toLowerCase();

document.querySelectorAll(".tool-card").forEach(function(card){

const text = card.innerText.toLowerCase();

if(text.indexOf(filter) > -1){

card.style.display = "";

}else{

card.style.display = "none";

}

});

});

}

// ===========================================
// Initial Dashboard Load
// ===========================================

updateDashboardStats();

console.log("Tool Manager V2 Loaded Successfully");

updateToolCounter();

});
