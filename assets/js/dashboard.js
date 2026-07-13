/*
===========================================
Dashboard
===========================================
*/

document.addEventListener("DOMContentLoaded", () => {

    console.log("Dashboard Loaded");

    loadDashboard();

});

function loadDashboard(){

    console.log("Loading Enterprise Dashboard...");

}

function logout(){

    alert("Logout will be connected with Firebase Authentication.");

}

/* ===========================================
   Dashboard V5 - Part 4
=========================================== */

function updateClock(){

    const now = new Date();

    const clock = document.getElementById("currentTime");

    if(clock){

        clock.innerHTML =
            now.toLocaleDateString() + " " +
            now.toLocaleTimeString();

    }

}

setInterval(updateClock,1000);

updateClock();

const refreshBtn = document.getElementById("refreshBtn");

if(refreshBtn){

    refreshBtn.addEventListener("click",()=>{

        location.reload();

    });

}
