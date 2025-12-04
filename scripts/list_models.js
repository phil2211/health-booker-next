const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Read .env.local manually since we can't rely on nextjs env loading here easily
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy model to get client
        // actually the client doesn't expose listModels directly on the instance usually, 
        // it's often on the class or a manager. 
        // Wait, the SDK structure:
        // const genAI = new GoogleGenerativeAI(API_KEY);
        // No direct listModels on genAI instance in some versions?

        // Let's try to just use the fetch directly if the SDK doesn't make it obvious, 
        // but the error message says "Call ListModels".

        // In node SDK:
        // const { GoogleGenerativeAI } = require("@google/generative-ai");
        // const genAI = new GoogleGenerativeAI(process.env.API_KEY);
        // This SDK is for generation. To list models we might need to use the REST API or look at SDK docs.

        // Let's try a simple fetch to the API endpoint for listing models.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log("Available models:");
        if (data.models) {
            data.models.forEach(m => {
                console.log(`- ${m.name} (Supported generation methods: ${m.supportedGenerationMethods})`);
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
