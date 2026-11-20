
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

async function sendAuthRequest(url, data) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Request failed.");
    }

    return result;
}

// SIGN UP
if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const result = await sendAuthRequest(
                "/api/auth/signup",
                { username, email, password }
            );

            message.textContent = result.message;
            message.style.color = "green";

            signupForm.reset();

            window.location.href = "/login.html";

        } catch (error) {
            message.textContent = error.message;
            message.style.color = "red";
        }
    });
}

// LOGIN
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            await sendAuthRequest(
                "/api/auth/login",
                { email, password }
            );

            window.location.href = "/dashboard";

        } catch (error) {
            message.textContent = error.message;
            message.style.color = "red";
        }
    });
}