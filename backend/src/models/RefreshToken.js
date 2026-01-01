const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const refreshTokenSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    user_id: { type: String, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expires_at: { type: Date, required: true },
}, {
    timestamps: { createdAt: 'created_at' }
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
