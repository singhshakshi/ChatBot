const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const authenticateToken = require('../middleware/auth');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const SYSTEM_PROMPT = `
You are a helpful, calm, and intelligent AI assistant. You provide accurate and thoughtful responses.
Your tone is polite, professional, and supportive.
You prioritize user safety and well-being while being as helpful as possible.
`;

// Get User's Chats (History)
router.get('/chats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const chats = await Chat.find({ user_id: userId })
            .sort({ updated_at: -1 }) // Most recent first
            .limit(50); // Limit to recent 50 chats for performance
        res.json(chats);
    } catch (error) {
        console.error('Fetch Chats Error:', error);
        res.status(500).json({ message: 'Failed to fetch chat history' });
    }
});

// Get Messages for a specific Chat
router.get('/chats/:chatId/messages', authenticateToken, async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        // Security check: Ensure chat belongs to user
        const chat = await Chat.findOne({ _id: chatId, user_id: userId });
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const messages = await Message.find({ chat_id: chatId })
            .sort({ created_at: 1 }); // Oldest to newest for display

        res.json(messages);
    } catch (error) {
        console.error('Fetch Messages Error:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

// Delete a Chat
router.delete('/chats/:chatId', authenticateToken, async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const chat = await Chat.findOneAndDelete({ _id: chatId, user_id: userId });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found or unauthorized' });
        }

        // Delete associated messages
        await Message.deleteMany({ chat_id: chatId });

        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Delete Chat Error:', error);
        res.status(500).json({ message: 'Failed to delete chat' });
    }
});

// Chat Endpoint (Existing)
router.post('/chat', authenticateToken, async (req, res) => {
    try {
        const { message, chatId } = req.body;
        const userId = req.user.id;
        let targetChatId = chatId;

        // 1. If no chatId, create a new chat
        if (!targetChatId) {
            const newChat = await Chat.create({
                user_id: userId,
                title: message.substring(0, 50) + '...'
            });
            targetChatId = newChat._id;
        } else {
            // Validate user owns the chat they are trying to append to
            const existingChat = await Chat.findOne({ _id: targetChatId, user_id: userId });
            if (!existingChat) {
                // Fallback: create new if not found or unauthorized (or return 403)
                // For now, let's treat unauthorized ID as a request for a new chat to prevent errors
                const newChat = await Chat.create({
                    user_id: userId,
                    title: message.substring(0, 50) + '...'
                });
                targetChatId = newChat._id;
            } else {
                // Update updated_at
                existingChat.updated_at = Date.now();
                await existingChat.save();
            }
        }

        // 2. Save User Message
        await Message.create({
            chat_id: targetChatId,
            role: 'user',
            content: message
        });

        // 3. Retrieve Conversation History (Last 20 messages)
        const historyDocs = await Message.find({ chat_id: targetChatId })
            .sort({ created_at: 1 })
            .limit(20);

        // Map to the format aiService expects
        const history = historyDocs.map(doc => ({
            role: doc.role,
            content: doc.content
        }));

        // 4. Generate AI Response
        const aiResponse = await aiService.generateResponse(history, SYSTEM_PROMPT);

        // 5. Save AI Message
        const savedAiMessage = await Message.create({
            chat_id: targetChatId,
            role: 'assistant',
            content: aiResponse.content,
            tokens_used: aiResponse.usage.total_tokens,
            model_used: aiResponse.model
        });

        res.json({
            chatId: targetChatId,
            message: aiResponse.content,
            id: savedAiMessage._id
        });

    } catch (error) {
        console.error('Chat Error Details:', error);
        res.status(500).json({
            message: 'Failed to process message',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
