
const express = require("express");
const { GoogleGenAI, Type } = require("@google/genai");

const router = express.Router();

// Initialize Gemini using the API key in .env
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Helper: Pause before retrying
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper: Get the HTTP error status
function getErrorStatus(error) {
    if (typeof error.status === "number") {
        return error.status;
    }

    if (typeof error.code === "number") {
        return error.code;
    }

    // Some SDK errors contain JSON in the message
    try {
        const parsed = JSON.parse(error.message);
        return parsed.error?.code || 0;
    } catch {
        return 0;
    }
}

// Retry Gemini when the service is overloaded
async function generateWithRetry(request) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(
                `Generating coffee: attempt ${attempt}/${maxAttempts}`
            );

            return await ai.models.generateContent(request);

        } catch (error) {
            const status = getErrorStatus(error);

            // Retry only temporary service errors
            const retryable = status === 503 || status === 429;

            if (!retryable || attempt === maxAttempts) {
                throw error;
            }

            // Exponential backoff: 1s, then 2s
            const delay = 1000 * (2 ** (attempt - 1));

            console.warn(
                `Gemini returned ${status}. Retrying in ${delay}ms...`
            );

            await sleep(delay);
        }
    }
}

// Middleware: Require login
function requireLogin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please log in to generate coffee recommendations."
        });
    }

    next();
}

// POST /api/coffee/recommend
router.post("/recommend", requireLogin, async (req, res) => {
    try {
        const {
            temperature,
            sweetness,
            strength,
            milk
        } = req.body || {};

        // Allowed preferences
        const allowed = {
            temperature: ["Hot", "Iced"],
            sweetness: ["Low", "Medium", "High"],
            strength: ["Mild", "Medium", "Strong"],
            milk: ["Whole", "Oat", "Almond", "None"]
        };

        const preferences = {
            temperature,
            sweetness,
            strength,
            milk
        };

        // Validate submitted preferences
        const isValid = Object.entries(allowed).every(
            ([key, values]) => values.includes(preferences[key])
        );

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Please select valid coffee preferences."
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({
                success: false,
                message: "Gemini API key is not configured."
            });
        }

        // Create prompt for Gemini
        const prompt = `
You are CoffeeCraft AI, a coffee recommendation assistant.

Recommend ONE realistic coffee drink based on:

Temperature: ${temperature}
Sweetness: ${sweetness}
Coffee strength: ${strength}
Milk preference: ${milk}

Requirements:
1. Recommend a realistic coffee drink.
2. Match the user's preferred temperature.
3. Match the requested sweetness and strength.
4. Respect the milk preference.
5. Explain why this drink is recommended.
6. Provide ingredients as a list.
7. Keep descriptions short and friendly.
8. Do not invent exact caffeine or nutrition values.

Return the following fields:
name, description, ingredients, reason.
`;

        // Gemini API request
        const request = {
            model: "gemini-3.5-flash-lite",
            contents: prompt,

            config: {
                responseMimeType: "application/json",

                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING
                        },

                        description: {
                            type: Type.STRING
                        },

                        ingredients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING
                            }
                        },

                        reason: {
                            type: Type.STRING
                        }
                    },

                    required: [
                        "name",
                        "description",
                        "ingredients",
                        "reason"
                    ]
                }
            }
        };

        // Generate a recommendation with retries
        const response = await generateWithRetry(request);

        if (!response.text) {
            throw new Error("Gemini returned an empty response.");
        }

        // Convert Gemini JSON into a JavaScript object
        const coffee = JSON.parse(response.text);

        // Validate the generated response
        const validResponse =
            typeof coffee.name === "string" &&
            typeof coffee.description === "string" &&
            typeof coffee.reason === "string" &&
            Array.isArray(coffee.ingredients) &&
            coffee.ingredients.every(
                ingredient => typeof ingredient === "string"
            );

        if (!validResponse) {
            throw new Error("Invalid coffee recommendation format.");
        }

        console.log("Coffee recommendation generated successfully!");

        // Send the recommendation to the frontend
        return res.status(200).json({
            success: true,
            recommendation: coffee
        });

    } catch (error) {
        const status = getErrorStatus(error);

        console.error("Gemini error:", error.message);

        if (status === 503) {
            return res.status(503).json({
                success: false,
                message:
                    "Our AI coffee assistant is temporarily busy. Please try again shortly."
            });
        }

        if (status === 429) {
            return res.status(429).json({
                success: false,
                message:
                    "The AI request limit has been reached. Please try again later."
            });
        }

        if (status === 404) {
            return res.status(502).json({
                success: false,
                message:
                    "The selected Gemini model is unavailable. Check your model configuration."
            });
        }

        return res.status(502).json({
            success: false,
            message:
                "Unable to generate a coffee recommendation. Please try again."
        });
    }
});

module.exports = router;