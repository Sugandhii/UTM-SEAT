
// ==============================
// PAGE NAVIGATION
// ==============================

function showPage(pageId) {
    const user = getUser();

    // Protect pages that require login
    const protectedPages = [
        "studentSection",
        "profileSection",
        "adminSection",
        "usersSection"
    ];

    if (protectedPages.includes(pageId) && !requireLogin()) {
        return;
    }

    // Protect admin pages
    if (
        ["adminSection", "usersSection"].includes(pageId) &&
        (!user || user.role.toLowerCase() !== "admin")
    ) {
        showPage("studentSection");
        return;
    }

    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.remove("hidden");
    }

    // Automatically load data when opening a page
    if (pageId === "profileSection") {
        loadProfile();
    }

    if (pageId === "usersSection") {
        loadUsers();
    }
}

// ==============================
// AUTHENTICATION
// ==============================

function getToken() {
    return localStorage.getItem("token");
}

function getUser() {
    return JSON.parse(localStorage.getItem("user") || "null");
}

function requireLogin() {
    if (!getToken() || !getUser()) {
        showPage("loginSection");
        return false;
    }

    return true;
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    showPage("loginSection");
}

// ==============================
// LOGIN
// ==============================

document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");

    try {
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role.toLowerCase() === "admin") {
            showPage("adminSection");
        } else {
            showPage("studentSection");
        }

    } catch (error) {
        message.textContent = error.message;
    }
});

// ==============================
// REGISTER
// ==============================

document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const student_id = document.getElementById("registerStudentId").value;
    const full_name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    const message = document.getElementById("registerMessage");

    try {
        await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                student_id,
                full_name,
                email,
                password
            })
        });

        message.textContent = "Registration successful! Please login.";
        message.style.color = "green";

        document.getElementById("registerForm").reset();

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
});

// ==============================
// PROFILE
// ==============================

async function loadProfile() {
    if (!requireLogin()) return;

    const message = document.getElementById("profileMessage");

    try {
        const data = await apiRequest("/profile");
        const user = data.user;

        document.getElementById("profileStudentId").value =
            user.student_id || "";

        document.getElementById("profileName").value =
            user.full_name || "";

        document.getElementById("profileEmail").value =
            user.email || "";

        message.textContent = "";

    } catch (error) {
        message.textContent = error.message;
    }
}

document.getElementById("profileForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const full_name = document.getElementById("profileName").value;
    const message = document.getElementById("profileMessage");

    try {
        await apiRequest("/profile", {
            method: "PUT",
            body: JSON.stringify({ full_name })
        });

        // Update saved user information
        const user = getUser();

        if (user) {
            user.full_name = full_name;
            localStorage.setItem("user", JSON.stringify(user));
        }

        message.textContent = "Profile updated successfully!";
        message.style.color = "green";

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
});

// ==============================
// ADMIN - VIEW USERS
// ==============================

async function loadUsers() {
    if (!requireLogin()) return;

    const user = getUser();
    const userList = document.getElementById("userList");

    if (!user || user.role.toLowerCase() !== "admin") {
        showPage("studentSection");
        return;
    }

    try {
        userList.innerHTML = "";

        const data = await apiRequest("/admin/users");
        const users = data.users || [];

        if (users.length === 0) {
            userList.innerHTML =
                '<tr><td colspan="5">No users found.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement("tr");

            const values = [
                user.user_id,
                user.student_id || "-",
                user.full_name,
                user.email,
                user.role
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "-";
                row.appendChild(cell);
            });

            userList.appendChild(row);
        });

    } catch (error) {
        userList.innerHTML = "";

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = error.message;

        row.appendChild(cell);
        userList.appendChild(row);
    }
}

// ==============================
// INITIAL PAGE
// ==============================

document.addEventListener("DOMContentLoaded", function () {
    const user = getUser();

    if (!getToken() || !user) {
        showPage("loginSection");
        return;
    }

    if (user.role.toLowerCase() === "admin") {
        showPage("adminSection");
    } else {
        showPage("studentSection");
    }
});
