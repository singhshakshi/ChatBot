require('dotenv').config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("Error: GEMINI_API_KEY is not set in .env");
        return;
    }

    console.log("Fetching available models using REST API...");
    // Mask key in logs if printing url (we are not printing url)
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response Body:", text);
            return;
        }

        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
        } else if (data.models) {
            console.log("\nSuccessfully retrieved models (supported for generateContent):");
            const generateModels = data.models.filter(m =>
                m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
            );

            if (generateModels.length === 0) {
                console.log("No models support generateContent.");
            } else {
                generateModels.forEach(m => {
                    // Extract simplistic name
                    const simpleName = m.name.replace('models/', '');
                    console.log(`- ${simpleName}`);
                });
            }

            console.log("\nTrying 'gemini-flash-latest' generation if available...");
            // Verify if gemini-flash-latest is in the list
            const flash = generateModels.find(m => m.name.includes('gemini-flash-latest'));
            if (flash) {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(key);
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                const result = await model.generateContent("Say hello!");
                console.log("Generation Test Success:", result.response.text());
            } else {
                console.log("gemini-flash-latest not found in list, skipping generation test.");
            }

        } else {
            console.log("No models found or unexpected response structure:", data);
        }
    } catch (error) {
        console.error("Network or script error:", error);
    }
}

listModels();
