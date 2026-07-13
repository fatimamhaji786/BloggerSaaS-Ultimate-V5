/*
===========================================
BloggerSaaS Ultimate V5 Enterprise
Global Application Script
===========================================
*/

const App = {

    version: "5.0 Enterprise",

    init() {
        console.log("BloggerSaaS Ultimate V5 Enterprise Loaded");
        console.log("Version:", this.version);

        this.showCurrentYear();
    },

    showCurrentYear() {
        const year = document.getElementById("currentYear");

        if (year) {
            year.textContent = new Date().getFullYear();
        }
    }

};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
