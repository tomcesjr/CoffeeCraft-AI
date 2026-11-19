
require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Allow JSON requests
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Test route
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "CoffeeCraft AI server is working!"
    });
});

// Start the HTTP server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
