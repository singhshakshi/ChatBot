const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const messageSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    chat_id: { type: String, ref: 'Chat', required: true },
    role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
    content: { type: String, required: true },
    tokens_used: { type: Number },
    model_used: { type: String },
}, {
    timestamps: { createdAt: 'created_at' }
});

module.exports = mongoose.model('Message', messageSchema);
