const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
    constructor() {
        this.mockMode = false;
        this.apiKey = process.env.GEMINI_API_KEY;
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        // Using the model verified in the test script
        this.modelName = "gemini-flash-latest";
        this.model = this.genAI.getGenerativeModel({
            model: this.modelName,
            // Safety settings could be added here if needed
        });
    }

    async generateResponse(messages, systemPrompt) {
        // If explicitly set or if API key is missing
        if (this.mockMode || !this.apiKey) {
            console.log("Using Mock Mode (Explicit or No API Key)");
            return this.generateMockResponse(messages);
        }

        try {
            if (!messages || messages.length === 0) {
                throw new Error("No messages provided");
            }

            const latestMessage = messages[messages.length - 1];
            if (!latestMessage.content) throw new Error("Latest message content is empty");

            // Map previous messages to Gemini format
            // user -> user, assistant -> model
            // Filter out empty messages to avoid 400 API errors
            const history = messages.slice(0, -1)
                .filter(msg => msg.content && msg.content.trim() !== '')
                .map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));

            // Instantiate model PER REQUEST to support dynamic system prompts
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                systemInstruction: systemPrompt
            });

            // Initialize Chat
            const chat = model.startChat({
                history: history
            });

            // 3. Send Message
            console.log(`Sending message via Gemini (${this.modelName})...`);
            const result = await chat.sendMessage(latestMessage.content);
            const response = await result.response;
            const text = response.text();

            // Get token usage if available
            const usage = response.usageMetadata || { totalTokenCount: 0 };

            return {
                content: text,
                usage: { total_tokens: usage.totalTokenCount || 0 },
                model: this.modelName
            };

        } catch (error) {
            console.error('Gemini API Error Details:', JSON.stringify(error, null, 2));
            if (error.message) console.error('Error Message:', error.message);

            console.log("Falling back to Mock Response due to error.");
            return this.generateMockResponse(messages);
        }
    }

    generateMockResponse(messages) {
        console.log("Generating Mock Response...");
        const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
        let reply = "I am an AI assistant. How can I help you?";

        if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
            reply = "Hello! I am Chatty, your intelligent assistant. I can help you with coding, general questions, or just have a chat. How can I help you today?";
        } else if (lastUserMessage.includes('time')) {
            reply = `It is currently ${new Date().toLocaleTimeString()}. Time flies when you're coding!`;
        } else if (lastUserMessage.includes('code') || lastUserMessage.includes('javascript') || lastUserMessage.includes('python')) {
            reply = "Here is a Python example for you:\n\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))\n```\n\nAnd a JavaScript one:\n```javascript\nconst greet = (name) => `Hello, ${name}!`;\nconsole.log(greet('Developer'));\n```";
        } else if (lastUserMessage.includes('who are you')) {
            reply = "I am Chatty, a chatbot built with React, Node.js, and MongoDB. I am now connected to the **Gemini API**, but if you are seeing this, I might be in fallback mode.";
        } else if (lastUserMessage.includes('weather')) {
            reply = "I can't check the real weather right now, but I hope it's sunny where you are! ☀️";
        } else if (lastUserMessage.includes('joke')) {
            reply = "Why do programmers prefer dark mode? Because light attracts bugs! 🐛";
        }

        return {
            content: reply,
            usage: { total_tokens: 50 },
            model: 'mock-v1'
        };
    }

    async streamResponse(messages, systemPrompt, onChunk) {
        throw new Error('Streaming not implemented yet');
    }
}

module.exports = new AIService();
