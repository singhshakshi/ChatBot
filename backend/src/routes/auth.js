const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email: email }, { username: username }]
        });

        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await User.create({
            username,
            email,
            password_hash: passwordHash,
            full_name
        });

        const tokens = generateTokens(newUser);

        // Store refresh token
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        await RefreshToken.create({
            user_id: newUser._id,
            token: tokens.refreshToken,
            expires_at: expiryDate
        });

        // Return user info (excluding password)
        const userResponse = newUser.toObject();
        delete userResponse.password_hash;

        res.status(201).json({ user: userResponse, ...tokens });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate tokens
        const tokens = generateTokens(user);

        // Update last login
        user.last_login = new Date();
        await user.save();

        // Store refresh token
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        await RefreshToken.create({
            user_id: user._id,
            token: tokens.refreshToken,
            expires_at: expiryDate
        });

        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            //   full_name: user.full_name, // Assuming full_name might be optional or not always present
            //   avatar_url: user.avatar_url // Assuming avatar_url might be optional or not always present
        };
        // Conditionally add full_name and avatar_url if they exist on the user object
        if (user.full_name) {
            userResponse.full_name = user.full_name;
        }
        if (user.avatar_url) {
            userResponse.avatar_url = user.avatar_url;
        }


        res.json({ user: userResponse, ...tokens });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { username, preferred_name, bio, avatar_url } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(409).json({ message: 'Username already taken' });
            }
            user.username = username;
        }

        if (preferred_name !== undefined) user.preferred_name = preferred_name;
        if (bio !== undefined) user.bio = bio;
        if (avatar_url !== undefined) user.avatar_url = avatar_url;

        await user.save();

        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            preferred_name: user.preferred_name,
            bio: user.bio,
            avatar_url: user.avatar_url
        };

        res.json({ user: userResponse, message: 'Profile updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;
