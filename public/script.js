
document.addEventListener("DOMContentLoaded", async () => {
    const guestNav = document.getElementById("guestNav");
    const userNav = document.getElementById("userNav");
    const getStartedBtn =
        document.getElementById("getStartedBtn");
    const logoutBtn =
        document.getElementById("homeLogoutBtn");

    // Check if the user is logged in
    try {
        const response = await fetch("/api/auth/me", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (response.ok) {
            // User is logged in
            guestNav.hidden = true;
            userNav.hidden = false;

            getStartedBtn.href = "/dashboard";
            getStartedBtn.textContent = "Go to Dashboard";
        } else {
            // User is not logged in
            guestNav.hidden = false;
            userNav.hidden = true;

            getStartedBtn.href = "/signup.html";
            getStartedBtn.textContent = "Get Started";
        }

    } catch (error) {
        console.error(
            "Unable to check login status:",
            error.message
        );
    }

    // Logout button
    logoutBtn.addEventListener("click", async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin"
            });

            if (!response.ok) {
                throw new Error("Logout failed.");
            }

            window.location.href = "/";

        } catch (error) {
            console.error("Logout error:", error.message);
            alert("Unable to log out. Please try again.");
        }
    });
});
