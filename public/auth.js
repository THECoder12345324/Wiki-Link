//USER PROFILE
import { signOutCompletely } from './fire.js';
let isLoggedIn = false;
let user = null;
const profileB = document.getElementById("profile");
profileB.addEventListener('click', () => {
    console.log("clicked");
    var content = document.getElementById("profileDropdown");
    content.classList.toggle("active");
    if (content.classList.contains("active")) {
        content.style.display = 'block';
    } else {
        content.style.display = 'none';
    }
});

const loginButton = document.getElementById("authOption");
loginButton.addEventListener('click', (e) => {
    e.preventDefault();
    let user = localStorage.getItem('user');
    let isLoggedIn = false;
    if (user) {
        isLoggedIn = false;
        signOutCompletely();
    } else {
        window.location.href = "login.html";
    }
    updateAuthOption();
});

function updateAuthOption() {
    const authOption = document.getElementById("authOption");
    authOption.textContent = isLoggedIn ? "Logout" : "Login";
    if (!isLoggedIn) {
        document.getElementById("saver").remove();
        document.getElementById("graphOption").remove();
        document.getElementById("profileOption").remove();
    }
}

window.onload = function() {
    user = localStorage.getItem('user');
    isLoggedIn = false;
    if (user) {
    isLoggedIn = true;
    }
    updateAuthOption();
}