
const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

// SIGN UP
router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !email.includes("@") ||
            password.length < 8 ||
            username.length > 50 ||
            email.length > 254 ||
            password.length > 72
        ) {
            return res.status(400).json({
                message: "Enter valid details and a password of 8-72 characters."
            });
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            $or: [
                { email: cleanEmail },
                { username: cleanUsername }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Username or email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            username: cleanUsername,
            email: cleanEmail,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "Account created successfully!",
            username: user.username
        });

    } catch (error) {
        console.error("Signup error:", error.message);

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Username or email already exists."
            });
        }

        res.status(500).json({
            message: "Unable to create account."
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        req.session.regenerate((error) => {
            if (error) {
                return res.status(500).json({
                    message: "Could not start session."
                });
            }

            req.session.userId = user._id.toString();
            req.session.username = user.username;

            req.session.save((error) => {
                if (error) {
                    return res.status(500).json({
                        message: "Could not save session."
                    });
                }

                res.json({
                    message: "Login successful!",
                    username: user.username
                });
            });
        });

    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({
            message: "Unable to log in."
        });
    }
});

// CURRENT USER
router.get("/me", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Not logged in."
        });
    }

    res.json({
        username: req.session.username
    });
});

// LOGOUT
router.post("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: "Logout failed."
            });
        }

        res.clearCookie("connect.sid");
        res.json({ message: "Logged out." });
    });
});

module.exports = router;
