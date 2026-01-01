require('dotenv').config();
const aiService = require('./src/services/aiService');

async function testService() {
    console.log("Initializing Test for AI Service...");

    // Simulate a conversation history
    const messages = [
        { role: 'user', content: 'Hi, I want to learn about space.' },
        { role: 'assistant', content: 'Space is fascinating! What specific aspect of space are you interested in?' },
        { role: 'user', content: 'Tell me a fun fact about Mars.' }
    ];

    const systemPrompt = "You are a helpful science teacher.";

    try {
        const start = Date.now();
        const response = await aiService.generateResponse(messages, systemPrompt);
        const duration = Date.now() - start;

        console.log("\n--- Response Received ---");
        console.log("Content:", response.content);
        console.log("Model Used:", response.model);
        console.log("Tokens:", response.usage.total_tokens);
        console.log(`Duration: ${duration}ms`);

        if (response.model === 'mock-v1') {
            console.log("\nWARNING: Service fell back to Mock Mode.");
        } else {
            console.log("\nSUCCESS: Real API response received.");
        }

    } catch (error) {
        console.error("Test Error:", error);
    }
}

testService();
