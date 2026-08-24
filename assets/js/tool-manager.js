/*
==========================================================
 BloggerSaaS Ultimate V5 Enterprise
 Tool Manager
==========================================================
*/
const firebaseConfig = {
    apiKey: "YOUR_EXISTING_FIREBASE_API_KEY",
    authDomain: "bloggersaas-v1.firebaseapp.com",
    databaseURL: "https://bloggersaas-v1-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bloggersaas-v1",
    storageBucket: "bloggersaas-v1.firebasestorage.app",
    messagingSenderId: "YOUR_EXISTING_MESSAGING_SENDER_ID",
    appId: "YOUR_EXISTING_FIREBASE_APP_ID"
};

/* ======================================================
   Firebase Initialization
====================================================== */

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();
const toolsRef = database.ref("tools");

/* ======================================================
   Application State
====================================================== */

let toolsCache = [];
let currentEditingKey = null;
let searchKeyword = "";

/* ======================================================
   DOM Elements
====================================================== */

const toolGrid = document.getElementById("toolGrid");
const modal = document.getElementById("toolModal");
const modalTitle = document.getElementById("modalTitle");
const addToolBtn = document.getElementById("addToolBtn");
const saveToolBtn = document.getElementById("saveToolBtn");
const closeBtn = document.querySelector(".close");
const searchInput = document.getElementById("searchTool");

const totalToolsCard = document.getElementById("totalTools");
const totalCategoriesCard = document.getElementById("totalCategories");
const activeToolsCard = document.getElementById("activeTools");
const lastUpdatedCard = document.getElementById("lastUpdated");

const toolName = document.getElementById("toolName");
const toolCategory = document.getElementById("toolCategory");
const toolURL = document.getElementById("toolURL");
const toolDescription = document.getElementById("toolDescription");

/* ======================================================
   Utility Functions
====================================================== */

function generateTimestamp() {
    return Date.now();
}

function generateReadableDate(timestamp) {
    if (!timestamp) return "--";

    return new Date(timestamp).toLocaleString();
}

/* ======================================================
   Authentication Guard
====================================================== */

auth.onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    console.log("✅ Tool Manager authenticated:", user.email);

    initializeToolManager();
});

/* ======================================================
   Initialize Tool Manager
====================================================== */

let initialized = false;

function initializeToolManager() {

    if (initialized) return;

    initialized = true;

    console.log("======================================");
    console.log(" BloggerSaaS Ultimate V5");
    console.log(" Tool Manager Started");
    console.log("======================================");

    initializeEvents();
    loadTools();
}

/* ======================================================
   Event Handlers
====================================================== */

function initializeEvents() {

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

        searchInput.addEventListener("input", function () {

            searchKeyword = this.value.trim().toLowerCase();

            renderTools();

        });

    }

    window.addEventListener("click", function (event) {

        if (event.target === modal) {
            closeModal();
        }

    });

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            closeModal();
        }

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "n"
        ) {

            event.preventDefault();

            openAddModal();

        }

    });

}

/* ======================================================
   Add Tool
====================================================== */

function openAddModal() {

    currentEditingKey = null;

    if (modalTitle) {
        modalTitle.textContent = "Add New Tool";
    }

    clearForm();

    if (modal) {
        modal.style.display = "block";
    }

}

/* ======================================================
   Edit Tool
====================================================== */

function openEditModal(toolKey) {

    const tool = toolsCache.find(
        item => item.key === toolKey
    );

    if (!tool) return;

    currentEditingKey = toolKey;

    if (modalTitle) {
        modalTitle.textContent = "Edit Tool";
    }

    if (toolName) {
        toolName.value = tool.name || "";
    }

    if (toolCategory) {
        toolCategory.value = tool.category || "";
    }

    if (toolURL) {
        toolURL.value = tool.url || "";
    }

    if (toolDescription) {
        toolDescription.value = tool.description || "";
    }

    if (modal) {
        modal.style.display = "block";
    }

}

/* ======================================================
   Close Modal
====================================================== */

function closeModal() {

    if (modal) {
        modal.style.display = "none";
    }

    clearForm();

    currentEditingKey = null;

}

/* ======================================================
   Clear Form
====================================================== */

function clearForm() {

    if (toolName) {
        toolName.value = "";
    }

    if (toolCategory) {
        toolCategory.value = "";
    }

    if (toolURL) {
        toolURL.value = "";
    }

    if (toolDescription) {
        toolDescription.value = "";
    }

}

/* ======================================================
   Validate Form
====================================================== */

function validateForm() {

    if (!toolName || toolName.value.trim() === "") {

        alert("Please enter Tool Name.");

        if (toolName) {
            toolName.focus();
        }

        return false;
    }

    if (
        !toolCategory ||
        toolCategory.value.trim() === ""
    ) {

        alert("Please enter Category.");

        if (toolCategory) {
            toolCategory.focus();
        }

        return false;
    }

    return true;
}

/* ======================================================
   Save Tool
====================================================== */

function saveTool() {

    if (!validateForm()) {
        return;
    }

    const toolData = {

        name: toolName.value.trim(),

        category: toolCategory.value.trim(),

        url: toolURL
            ? toolURL.value.trim()
            : "",

        description: toolDescription
            ? toolDescription.value.trim()
            : "",

        active: true,

        featured: false,

        updatedAt: generateTimestamp()

    };

    /* --------------------------------------------------
       Update Existing Tool
    -------------------------------------------------- */

    if (currentEditingKey) {

        database
            .ref("tools/" + currentEditingKey)
            .update(toolData)
            .then(() => {

                alert("✅ Tool Updated Successfully");

                closeModal();

            })
            .catch((error) => {

                console.error(
                    "Tool update failed:",
                    error
                );

                alert(
                    "Unable to update tool: " +
                    error.message
                );

            });

        return;
    }

    /* --------------------------------------------------
       Create New Tool
    -------------------------------------------------- */

    toolData.createdAt = generateTimestamp();

    database
        .ref("tools")
        .push(toolData)
        .then(() => {

            alert("✅ New Tool Added");

            closeModal();

        })
        .catch((error) => {

            console.error(
                "Tool creation failed:",
                error
            );

            alert(
                "Unable to add tool: " +
                error.message
            );

        });

}

/* ======================================================
   Load Tools
====================================================== */

function loadTools() {

    toolsRef.on(
        "value",
        (snapshot) => {

            toolsCache = [];

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    toolsCache.push({

                        key: child.key,

                        ...child.val()

                    });

                });

            }

            renderTools();

            updateDashboard();

        },
        (error) => {

            console.error(
                "Firebase tools read failed:",
                error
            );

            if (toolGrid) {

                toolGrid.innerHTML = `
                    <div class="empty-state">
                        <h2>Firebase Error</h2>
                        <p>${error.message}</p>
                    </div>
                `;

            }

        }
    );

}

/* ======================================================
   Render Tools
====================================================== */

function renderTools() {

    if (!toolGrid) return;

    toolGrid.innerHTML = "";

    let visibleTools = toolsCache;

    if (searchKeyword !== "") {

        visibleTools = visibleTools.filter(
            (tool) => {

                const name =
                    (tool.name || "")
                    .toLowerCase();

                const category =
                    (tool.category || "")
                    .toLowerCase();

                return (
                    name.includes(searchKeyword) ||
                    category.includes(searchKeyword)
                );

            }
        );

    }

    if (visibleTools.length === 0) {

        renderEmptyState();

        return;
    }

    visibleTools.forEach((tool) => {

        toolGrid.appendChild(
            createToolCard(tool)
        );

    });

}

/* ======================================================
   Create Tool Card
====================================================== */

function createToolCard(tool) {

    const card =
        document.createElement("div");

    card.className = "tool-card";

    card.dataset.key = tool.key;

    const statusText =
        tool.active === false
            ? "Inactive"
            : "Active";

    const statusClass =
        tool.active === false
            ? "status-inactive"
            : "status-active";

    card.innerHTML = `

        <div class="tool-header">

            <h3>
                ${escapeHTML(tool.name || "Unnamed Tool")}
            </h3>

            <span class="${statusClass}">
                ${statusText}
            </span>

        </div>

        <div class="tool-body">

            <p>
                <strong>Category</strong><br>
                ${escapeHTML(tool.category || "-")}
            </p>

            <p>
                <strong>URL</strong><br>
                ${escapeHTML(tool.url || "-")}
            </p>

            <p>
                ${escapeHTML(tool.description || "")}
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
                ${
                    tool.featured
                        ? "⭐ Featured"
                        : "☆ Feature"
                }
            </button>

            <button
                class="status-btn"
                onclick="toggleStatus('${tool.key}')">
                ${
                    tool.active === false
                        ? "🟢 Activate"
                        : "🔴 Disable"
                }
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

/* ======================================================
   HTML Escape
====================================================== */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

/* ======================================================
   Empty State
====================================================== */

function renderEmptyState() {

    if (!toolGrid) return;

    toolGrid.innerHTML = `

        <div class="empty-state">

            <i class="fas fa-toolbox"></i>

            <h2>No Tools Found</h2>

            <p>
                Click "Add New Tool" to create
                your first tool.
            </p>

        </div>

    `;

}

/* ======================================================
   Dashboard Statistics
====================================================== */

function updateDashboard() {

    const total =
        toolsCache.length;

    const active =
        toolsCache.filter(
            tool => tool.active !== false
        ).length;

    const categories =
        new Set(
            toolsCache
                .map(tool => tool.category)
                .filter(Boolean)
        );

    let latest = 0;

    toolsCache.forEach((tool) => {

        if (
            tool.updatedAt &&
            tool.updatedAt > latest
        ) {

            latest = tool.updatedAt;

        }

    });

    if (totalToolsCard) {
        totalToolsCard.textContent = total;
    }

    if (activeToolsCard) {
        activeToolsCard.textContent = active;
    }

    if (totalCategoriesCard) {
        totalCategoriesCard.textContent =
            categories.size;
    }

    if (lastUpdatedCard) {

        lastUpdatedCard.textContent =
            latest
                ? generateReadableDate(latest)
                : "--";

    }

}

/* ======================================================
   Delete Tool
====================================================== */

function deleteTool(toolKey) {

    const tool =
        toolsCache.find(
            item => item.key === toolKey
        );

    if (!tool) return;

    const confirmed = confirm(
        `Delete "${tool.name}" permanently?`
    );

    if (!confirmed) {
        return;
    }

    toolsRef
        .child(toolKey)
        .remove()
        .then(() => {

            console.log(
                "✅ Tool deleted successfully."
            );

        })
        .catch((error) => {

            console.error(
                "Delete failed:",
                error
            );

            alert(
                "Unable to delete tool: " +
                error.message
            );

        });

}

/* ======================================================
   Toggle Featured
====================================================== */

function toggleFeatured(toolKey) {

    const tool =
        toolsCache.find(
            item => item.key === toolKey
        );

    if (!tool) return;

    toolsRef
        .child(toolKey)
        .update({

            featured:
                !tool.featured,

            updatedAt:
                generateTimestamp()

        })
        .catch((error) => {

            alert(
                "Unable to update feature status: " +
                error.message
            );

        });

}

/* ======================================================
   Toggle Active Status
====================================================== */

function toggleStatus(toolKey) {

    const tool =
        toolsCache.find(
            item => item.key === toolKey
        );

    if (!tool) return;

    toolsRef
        .child(toolKey)
        .update({

            active:
                !(tool.active === false),

            updatedAt:
                generateTimestamp()

        })
        .catch((error) => {

            alert(
                "Unable to update tool status: " +
                error.message
            );

        });

}

/* ======================================================
   Console
====================================================== */

console.log(
    "✅ BloggerSaaS Ultimate V5 Tool Manager loaded."
);
