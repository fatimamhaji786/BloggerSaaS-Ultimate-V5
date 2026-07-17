/*==========================================================
 BloggerSaaS Ultimate V3
 Tool Manager
 Version : 3.0
 Author : ChatGPT + Fatima Haji
==========================================================*/

/*==========================================================
 Firebase Configuration
==========================================================*/

const firebaseConfig = {
    apiKey: "AIzaSyBJLJTKsM3wjYZFx9je2tAtxs4zPQu_7e8",
    authDomain: "bloggersaas-v1.firebaseapp.com",
    databaseURL:
    "https://bloggersaas-v1-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bloggersaas-v1",
    storageBucket: "bloggersaas-v1.firebasestorage.app",
    messagingSenderId: "187643103324",
    appId:
    "1:187643103324:web:e5070919496c09a277be99"
};

/*==========================================================
 Initialize Firebase
==========================================================*/

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();
const auth = firebase.auth();

/*==========================================================
 Global Variables
==========================================================*/

let currentEditingKey = null;

let tools = [];

let filteredTools = [];

let currentSort = "name";

let currentCategory = "All";

/*==========================================================
 DOM Elements
==========================================================*/

const toolGrid = document.getElementById("toolGrid");

const modal = document.getElementById("toolModal");

const modalTitle = document.getElementById("modalTitle");

const addToolBtn = document.getElementById("addToolBtn");

const saveToolBtn = document.getElementById("saveToolBtn");

const closeBtn = document.querySelector(".close");

const searchInput = document.getElementById("searchTool");

const totalTools = document.getElementById("totalTools");

const totalCategories = document.getElementById("totalCategories");

const activeTools = document.getElementById("activeTools");

const lastUpdated = document.getElementById("lastUpdated");

/*==========================================================
 Firebase Reference
==========================================================*/

const toolsRef = database.ref("tools");

/*==========================================================
 Application Start
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    console.clear();

    console.log("======================================");

    console.log(" BloggerSaaS Ultimate V3");

    console.log(" Tool Manager Started");

    console.log("======================================");

    initializeToolManager();

});

// ======================================================
// BloggerSaaS Ultimate V3
// Tool Manager
// Part 2
// Authentication + Global Variables
// ======================================================

// ------------------------------------------------------
// Firebase Services
// ------------------------------------------------------

const auth = firebase.auth();
const database = firebase.database();

// ------------------------------------------------------
// Authentication Guard
// ------------------------------------------------------

auth.onAuthStateChanged((user) => {

    if (!user) {

        window.location.href = "../login.html";
        return;

    }

    console.log("✅ Logged in as:", user.email);

});

// ------------------------------------------------------
// Global Variables
// ------------------------------------------------------

let currentEditingKey = null;
let currentEditingCard = null;

let toolsCache = [];

let selectedCategory = "all";

let searchKeyword = "";

// ------------------------------------------------------
// DOM Elements
// ------------------------------------------------------

const toolGrid = document.getElementById("toolGrid");

const modal = document.getElementById("toolModal");

const modalTitle = document.getElementById("modalTitle");

const saveToolBtn = document.getElementById("saveToolBtn");

const addToolBtn = document.getElementById("addToolBtn");

const searchInput = document.getElementById("searchTool");

const closeBtn = document.querySelector(".close");

// Dashboard Cards

const totalToolsCard =
document.getElementById("totalTools");

const totalCategoriesCard =
document.getElementById("totalCategories");

const activeToolsCard =
document.getElementById("activeTools");

const lastUpdatedCard =
document.getElementById("lastUpdated");

// ------------------------------------------------------
// Form Fields
// ------------------------------------------------------

const toolName =
document.getElementById("toolName");

const toolCategory =
document.getElementById("toolCategory");

const toolURL =
document.getElementById("toolURL");

const toolDescription =
document.getElementById("toolDescription");

// ------------------------------------------------------
// Utility
// ------------------------------------------------------

function generateTimestamp(){

    return Date.now();

}

function generateReadableDate(timestamp){

    if(!timestamp) return "--";

    return new Date(timestamp).toLocaleString();

}

// ------------------------------------------------------
// Initial Application Load
// ------------------------------------------------------

document.addEventListener("DOMContentLoaded",()=>{

    console.log("🚀 Tool Manager V3 Started");

    initialiseEvents();

    loadTools();

});

// ======================================================
// BloggerSaaS Ultimate V3
// Tool Manager
// Part 3
// Modal Manager + Form Validation
// ======================================================

// ------------------------------------------------------
// Initialise Events
// ------------------------------------------------------

function initialiseEvents() {

    if (addToolBtn) {
        addToolBtn.addEventListener("click", openAddModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
    }

    if (saveToolBtn) {
        saveToolBtn.addEventListener("click", saveTool);
    }

    if (searchInput) {

        searchInput.addEventListener("keyup", function () {

            searchKeyword = this.value.toLowerCase();

            renderTools();

        });

    }

    window.addEventListener("click", function (e) {

        if (e.target === modal) {

            closeModal();

        }

    });

}

// ------------------------------------------------------
// Open Add Tool Modal
// ------------------------------------------------------

function openAddModal() {

    currentEditingKey = null;

    modalTitle.innerHTML =
    '<i class="fas fa-plus-circle"></i> Add New Tool';

    clearForm();

    modal.style.display = "block";

}

// ------------------------------------------------------
// Open Edit Tool Modal
// ------------------------------------------------------

function openEditModal(toolKey) {

    currentEditingKey = toolKey;

    const tool = toolsCache.find(t => t.key === toolKey);

    if (!tool) return;

    modalTitle.innerHTML =
    '<i class="fas fa-edit"></i> Edit Tool';

    toolName.value = tool.name || "";

    toolCategory.value = tool.category || "";

    toolURL.value = tool.url || "";

    toolDescription.value =
    tool.description || "";

    modal.style.display = "block";

}

// ------------------------------------------------------
// Close Modal
// ------------------------------------------------------

function closeModal() {

    modal.style.display = "none";

    clearForm();

    currentEditingKey = null;

}

// ------------------------------------------------------
// Clear Form
// ------------------------------------------------------

function clearForm() {

    toolName.value = "";

    toolCategory.value = "";

    toolURL.value = "";

    toolDescription.value = "";

}

// ------------------------------------------------------
// Form Validation
// ------------------------------------------------------

function validateForm() {

    if (toolName.value.trim() === "") {

        alert("Please enter Tool Name.");

        toolName.focus();

        return false;

    }

    if (toolCategory.value.trim() === "") {

        alert("Please enter Category.");

        toolCategory.focus();

        return false;

    }

    return true;

}

// ------------------------------------------------------
// Save Tool
// ------------------------------------------------------

function saveTool() {

    if (!validateForm()) return;

    const toolData = {

        name: toolName.value.trim(),

        category: toolCategory.value.trim(),

        url: toolURL.value.trim(),

        description: toolDescription.value.trim(),

        active: true,

        featured: false,

        updatedAt: generateTimestamp()

    };

    // ----------------------------
    // Edit Existing Tool
    // ----------------------------

    if (currentEditingKey) {

        database
        .ref("tools/" + currentEditingKey)
        .update(toolData)
        .then(() => {

            alert("✅ Tool Updated Successfully");

            closeModal();

        })
        .catch(error => {

            alert(error.message);

        });

        return;

    }

    // ----------------------------
    // New Tool
    // ----------------------------

    toolData.createdAt = generateTimestamp();

    database
    .ref("tools")
    .push(toolData)
    .then(() => {

        alert("✅ New Tool Added");

        closeModal();

    })
    .catch(error => {

        alert(error.message);

    });

     }
// ======================================================
// BloggerSaaS Ultimate V3
// Tool Manager
// Part 4
// Load Tools + Render Cards
// ======================================================

// ------------------------------------------------------
// Load Tools from Firebase
// ------------------------------------------------------

function loadTools() {

    toolsRef.on("value", (snapshot) => {

        toolsCache = [];

        if (!snapshot.exists()) {

            renderEmptyState();

            updateDashboard();

            return;

        }

        snapshot.forEach((child) => {

            toolsCache.push({

                key: child.key,

                ...child.val()

            });

        });

        renderTools();

        updateDashboard();

    });

}

// ------------------------------------------------------
// Render Tools
// ------------------------------------------------------

function renderTools() {

    toolGrid.innerHTML = "";

    let visibleTools = toolsCache;

    // ------------------------------
    // Search
    // ------------------------------

    if (searchKeyword !== "") {

        visibleTools = visibleTools.filter(tool =>

            (tool.name || "")
            .toLowerCase()
            .includes(searchKeyword)

            ||

            (tool.category || "")
            .toLowerCase()
            .includes(searchKeyword)

        );

    }

    // ------------------------------
    // Empty Search
    // ------------------------------

    if (visibleTools.length === 0) {

        renderEmptyState();

        return;

    }

    // ------------------------------
    // Cards
    // ------------------------------

    visibleTools.forEach(tool => {

        toolGrid.appendChild(

            createToolCard(tool)

        );

    });

}

// ------------------------------------------------------
// Tool Card
// ------------------------------------------------------

function createToolCard(tool) {

    const card = document.createElement("div");

    card.className = "tool-card";

    card.dataset.key = tool.key;

    card.dataset.name =
    (tool.name || "").toLowerCase();

    card.dataset.category =
    (tool.category || "").toLowerCase();

    card.innerHTML = `

        <div class="tool-header">

            <h3>${tool.name}</h3>

            <span class="${
                tool.active===false
                ? "status-inactive"
                : "status-active"
            }">

            ${
                tool.active===false
                ? "Inactive"
                : "Active"
            }

            </span>

        </div>

        <div class="tool-body">

            <p>

            <strong>Category</strong>

            <br>

            ${tool.category || "-"}

            </p>

            <p>

            <strong>URL</strong>

            <br>

            ${tool.url || "-"}

            </p>

            <p>

            ${tool.description || ""}

            </p>

        </div>

        <div class="tool-footer">

            <button
            class="edit-btn"
            onclick="openEditModal('${tool.key}')">

            ✏️ Edit

            </button>

            <button
            class="feature-btn"
            onclick="toggleFeatured('${tool.key}')">

            ${tool.featured ? "⭐ Featured" : "☆ Feature"}

            </button>

            <button
            class="status-btn"
            onclick="toggleStatus('${tool.key}')">

            ${tool.active===false
            ? "🟢 Activate"
            : "🔴 Disable"}

            </button>

            <button
            class="delete-btn"
            onclick="deleteTool('${tool.key}')">

            🗑 Delete

            </button>

        </div>

    `;

    return card;

}

// ------------------------------------------------------
// Empty State
// ------------------------------------------------------

function renderEmptyState() {

    toolGrid.innerHTML = `

    <div class="empty-state">

        <i class="fas fa-toolbox"></i>

        <h2>No Tools Found</h2>

        <p>

        Click Add Tool to create your first tool.

        </p>

    </div>

    `;

}

// ------------------------------------------------------
// Dashboard Statistics
// ------------------------------------------------------

function updateDashboard() {

    totalToolsCard.innerHTML = toolsCache.length;

    const categories = new Set();

    let active = 0;

    let newest = 0;

    toolsCache.forEach(tool => {

        if (tool.category) {

            categories.add(tool.category);

        }

        if (tool.active !== false) {

            active++;

        }

        if (tool.updatedAt > newest) {

            newest = tool.updatedAt;

        }

    });

    totalCategoriesCard.innerHTML =
    categories.size;

    activeToolsCard.innerHTML =
    active;

    lastUpdatedCard.innerHTML =
    generateReadableDate(newest);

              }

// ======================================================
// BloggerSaaS Ultimate V3
// Tool Manager
// Part 5
// Tool Actions
// ======================================================

// ------------------------------------------------------
// Delete Tool
// ------------------------------------------------------

function deleteTool(toolKey) {

    const tool = toolsCache.find(t => t.key === toolKey);

    if (!tool) return;

    const confirmed = confirm(
        `Delete "${tool.name}" permanently?`
    );

    if (!confirmed) return;

    toolsRef.child(toolKey)
        .remove()
        .then(() => {

            console.log("Tool Deleted");

        })
        .catch(error => {

            alert(error.message);

        });

}

// ------------------------------------------------------
// Toggle Featured
// ------------------------------------------------------

function toggleFeatured(toolKey) {

    const tool = toolsCache.find(t => t.key === toolKey);

    if (!tool) return;

    toolsRef.child(toolKey).update({

        featured: !tool.featured,

        updatedAt: generateTimestamp()

    });

}

// ------------------------------------------------------
// Toggle Active
// ------------------------------------------------------

function toggleStatus(toolKey) {

    const tool = toolsCache.find(t => t.key === toolKey);

    if (!tool) return;

    toolsRef.child(toolKey).update({

        active: !(tool.active === false),

        updatedAt: generateTimestamp()

    });

}

// ------------------------------------------------------
// Refresh Dashboard
// ------------------------------------------------------

function refreshDashboard() {

    renderTools();

    updateDashboard();

}

// ------------------------------------------------------
// Dashboard Counters
// ------------------------------------------------------

function updateCounters() {

    totalToolsCard.innerHTML =
        toolsCache.length;

    activeToolsCard.innerHTML =
        toolsCache.filter(
            tool => tool.active !== false
        ).length;

    totalCategoriesCard.innerHTML =
        new Set(
            toolsCache.map(
                tool => tool.category
            )
        ).size;

}

// ------------------------------------------------------
// Last Updated Card
// ------------------------------------------------------

function updateLastUpdated() {

    if (toolsCache.length === 0) {

        lastUpdatedCard.innerHTML = "--";

        return;

    }

    let latest = 0;

    toolsCache.forEach(tool => {

        if (tool.updatedAt > latest) {

            latest = tool.updatedAt;

        }

    });

    lastUpdatedCard.innerHTML =
        generateReadableDate(latest);

}

// ------------------------------------------------------
// Complete Dashboard Refresh
// ------------------------------------------------------

function updateDashboard() {

    updateCounters();

    updateLastUpdated();

}

// ------------------------------------------------------
// Firebase Live Updates
// ------------------------------------------------------

toolsRef.on("value", (snapshot) => {

    toolsCache = [];

    if (snapshot.exists()) {

        snapshot.forEach(child => {

            toolsCache.push({

                key: child.key,

                ...child.val()

            });

        });

    }

    refreshDashboard();

});

// ------------------------------------------------------
// Console Message
// ------------------------------------------------------

console.log("✅ Part 5 Loaded Successfully");

/*==========================================================
 BloggerSaaS Ultimate V3
 Tool Manager
 Part 6
 Dashboard Statistics
==========================================================*/

// ------------------------------------------------------
// Update Dashboard Statistics
// ------------------------------------------------------

function updateDashboard() {

    let total = toolsCache.length;

    let active = 0;

    let categories = new Set();

    let latestUpdate = 0;

    let featured = 0;

    toolsCache.forEach(tool => {

        if (tool.active !== false) {
            active++;
        }

        if (tool.featured === true) {
            featured++;
        }

        if (tool.category) {
            categories.add(tool.category);
        }

        if (tool.updatedAt && tool.updatedAt > latestUpdate) {
            latestUpdate = tool.updatedAt;
        }

    });

    if (totalToolsCard)
        totalToolsCard.textContent = total;

    if (activeToolsCard)
        activeToolsCard.textContent = active;

    if (totalCategoriesCard)
        totalCategoriesCard.textContent = categories.size;

    if (lastUpdatedCard) {

        if (latestUpdate === 0) {

            lastUpdatedCard.textContent = "--";

        } else {

            lastUpdatedCard.textContent =
            new Date(latestUpdate).toLocaleDateString();

        }

    }

}

// ------------------------------------------------------
// Refresh Dashboard after Every Firebase Change
// ------------------------------------------------------

toolsRef.on("value", function () {

    updateDashboard();

});

// ------------------------------------------------------
// Empty State
// ------------------------------------------------------

function showEmptyState() {

    toolGrid.innerHTML = `

        <div class="empty-state">

            <i class="fas fa-toolbox"
               style="
                    font-size:60px;
                    color:#3b82f6;
                    margin-bottom:20px;">
            </i>

            <h2>No Tools Found</h2>

            <p>
            Click "Add Tool" to create your first tool.
            </p>

        </div>

    `;

}

// ------------------------------------------------------
// Refresh Dashboard Every Minute
// ------------------------------------------------------

setInterval(function () {

    updateDashboard();

}, 60000);

// ------------------------------------------------------
// Console
// ------------------------------------------------------

console.log("✅ Dashboard Statistics Ready");

// ======================================================
// BloggerSaaS Ultimate V3
// Tool Manager
// Part 8
// Dashboard + Auto Refresh + Final Initialisation
// ======================================================

// ------------------------------------------------------
// Dashboard Statistics
// ------------------------------------------------------

function updateDashboard() {

    const total = toolsCache.length;

    const active = toolsCache.filter(t => t.active !== false).length;

    const categories = new Set();

    let latest = 0;

    toolsCache.forEach(tool => {

        if (tool.category) {

            categories.add(tool.category);

        }

        if (tool.updatedAt && tool.updatedAt > latest) {

            latest = tool.updatedAt;

        }

    });

    if (totalToolsCard)
        totalToolsCard.textContent = total;

    if (activeToolsCard)
        activeToolsCard.textContent = active;

    if (totalCategoriesCard)
        totalCategoriesCard.textContent = categories.size;

    if (lastUpdatedCard)
        lastUpdatedCard.textContent =
        latest
            ? new Date(latest).toLocaleString()
            : "--";

}

// ------------------------------------------------------
// Refresh Everything
// ------------------------------------------------------

function refreshDashboard() {

    updateDashboard();

    renderTools();

}

// ------------------------------------------------------
// Keyboard Shortcuts
// ------------------------------------------------------

document.addEventListener("keydown", function (e) {

    // ESC closes popup

    if (e.key === "Escape") {

        closeModal();

    }

    // Ctrl + N

    if (e.ctrlKey && e.key.toLowerCase() === "n") {

        e.preventDefault();

        openAddModal();

    }

});

// ------------------------------------------------------
// Export JSON (Future)
// ------------------------------------------------------

function exportTools() {

    console.log("Export coming soon.");

}

// ------------------------------------------------------
// Import JSON (Future)
// ------------------------------------------------------

function importTools() {

    console.log("Import coming soon.");

}

// ------------------------------------------------------
// Application Initialisation
// ------------------------------------------------------

function initializeToolManager() {

    initialiseEvents();

    loadTools();

}

// ------------------------------------------------------
// Firebase Live Refresh
// ------------------------------------------------------

toolsRef.on("value", function () {

    console.log("Firebase Updated");

});

// ------------------------------------------------------
// Console Banner
// ------------------------------------------------------

console.log(
"%c BloggerSaaS Ultimate V3 Loaded",
"color:#38bdf8;font-size:16px;font-weight:bold;"
);

console.log(
"%c Tool Manager Ready",
"color:#22c55e;font-size:14px;"
);

// ======================================================
// End of File
// ======================================================
