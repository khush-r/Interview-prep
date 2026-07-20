require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

async function test() {
    console.log("Starting request...");

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: "Say hello"
        });

        console.log("Response received!");
        console.log(response.text);
    } catch (err) {
        console.error("ERROR:");
        console.error(err);
    }

    console.log("Finished.");
}

test();