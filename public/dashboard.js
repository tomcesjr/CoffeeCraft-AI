
// Dashboard elements
const coffeeForm = document.getElementById("coffeeForm");
const results = document.getElementById("results");
const statusText = document.getElementById("status");
const generateBtn = document.getElementById("generateBtn");

// Load the logged-in user
async function loadUser() {
    try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
            window.location.href = "/login.html";
            return;
        }

        const user = await response.json();

        document.getElementById("welcome")
            .textContent = `Welcome, ${user.username}!`;

    } catch (error) {
        statusText.textContent = "Unable to load user.";
    }
}

// Generate coffee recommendation
coffeeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const preferences = {
        temperature: document.getElementById("temperature").value,
        sweetness: document.getElementById("sweetness").value,
        strength: document.getElementById("strength").value,
        milk: document.getElementById("milk").value
    };

    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    statusText.textContent = "Gemini is creating your coffee!";
    results.hidden = true;

    try {
        const response = await fetch("/api/coffee/recommend", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify(preferences)
        });

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.message || "Recommendation failed."
            );
        }

        const coffee = data.recommendation;

        document.getElementById("coffeeName")
            .textContent = coffee.name;

        document.getElementById("coffeeDescription")
            .textContent = coffee.description;

        document.getElementById("coffeeReason")
            .textContent = coffee.reason;

        const ingredientList =
            document.getElementById("ingredients");

        ingredientList.replaceChildren();

        coffee.ingredients.forEach((ingredient) => {
            const li = document.createElement("li");
            li.textContent = ingredient;
            ingredientList.appendChild(li);
        });

        results.hidden = false;
        statusText.textContent = "Recommendation generated!";

    } catch (error) {
        statusText.textContent = error.message;

    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent =
            "Generate Coffee Recommendation";
    }
});

// Logout
document.getElementById("logoutBtn")
    .addEventListener("click", async () => {
        const response = await fetch("/api/auth/logout", {
            method: "POST"
        });

        if (response.ok) {
            window.location.href = "/login.html";
        } else {
            statusText.textContent = "Logout failed.";
        }
    });

loadUser();