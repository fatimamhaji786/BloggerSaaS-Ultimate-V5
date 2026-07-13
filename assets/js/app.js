/*
===========================================
BloggerSaaS Ultimate V5 Enterprise
Global Application Script
===========================================
*/

document.addEventListener("DOMContentLoaded", () => {

    console.log("BloggerSaaS Ultimate V5 Loaded");

    // Current Year
    const year = document.getElementById("year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // Dark Mode Toggle
    const darkToggle = document.getElementById("darkToggle");

    if (darkToggle) {

        darkToggle.addEventListener("click", () => {

            document.body.classList.toggle("dark-mode");

            const enabled =
                document.body.classList.contains("dark-mode");

            localStorage.setItem("darkMode", enabled);

        });

        if (localStorage.getItem("darkMode") === "true") {
            document.body.classList.add("dark-mode");
        }

    }

});
