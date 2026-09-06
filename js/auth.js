// =========================
// Authentication Check
// =========================

const session = JSON.parse(
    localStorage.getItem("currentUser")
);

if (!session) {

    window.location.href = "index.html";

}

// =========================
// Welcome User
// =========================

const welcomeUser = document.getElementById("welcomeUser");

if (welcomeUser && session) {

    welcomeUser.textContent =
        `Welcome, ${session.fullname}`;

}

// =========================
// Logout
// =========================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("currentUser");

        window.location.href = "index.html";

    });

}
