
require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const coffeeRoutes = require("./routes/coffeeRoutes");


const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// Middleware
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        dbName: "coffeecraft"
    }),

    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Authentication API
app.use("/api/auth", authRoutes);
app.use("/api/coffee", coffeeRoutes);

// Protected dashboard
app.get("/dashboard", (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/login.html");
    }

    res.sendFile(
        path.join(__dirname, "private", "dashboard.html")
    );
});

// Public frontend
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "CoffeeCraft AI is running!"
    });
});

// Start after MongoDB connects
async function startServer() {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();