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
