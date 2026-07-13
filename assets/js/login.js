/*
===========================================
Login Page
===========================================
*/

document.addEventListener("DOMContentLoaded", () => {

    console.log("Login Page Loaded");

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", function(e){

            e.preventDefault();

            alert("Firebase Authentication will be connected in the next step.");

        });

    }

});
