// =========================
// Demo Users
// =========================

const existingSession = JSON.parse(
    localStorage.getItem("currentUser")
);

if (existingSession) {
    window.location.href = "dashboard.html";
}

const users = [
    {
        username: "admin",
        password: "admin123",
        fullname: "Administrator",
        role: "Administrator"
    },
    {
        username: "jon",
        password: "00000",
        fullname: "Jon Morcon",
        role: "Document Controller"
    },
    {
        username: "john",
        password: "12345",
        fullname: "John Paul",
        role: "Document Controller"
    },
    {
        username: "Tyrone",
        password: "12345",
        fullname: "Tyrone Dhan Tomalon",
        role: "Documentation Manager"
    },
    {
        username: "Loy",
        password: "12345",
        fullname: "Arlou Isidro",
        role: "Document Controller"
    }
];

// =========================
// Login
// =========================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

loginForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        const user = users.find(u =>
            u.username.toLowerCase() === username.toLowerCase() &&
            u.password === password
        );

        if (!user) {
            alert("Invalid username or password.");
            return;
        }

        const session = {
            username: user.username,
            fullname: user.fullname,
            role: user.role,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem(
            "currentUser",
            JSON.stringify(session)
        );

        window.location.href = "dashboard.html";

    });
    
}
