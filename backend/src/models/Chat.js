const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    user_id: { type: String, ref: 'User', required: true },
    title: { type: String, default: 'New Conversation' },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Chat', chatSchema);
