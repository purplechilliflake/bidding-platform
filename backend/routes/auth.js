const express = require('express');
const router = express.Router();
const { redisClient } = require('../config/redis');

router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const userKey = `user:${email}`;

    if (await redisClient.exists(userKey)) {
        return res.status(400).json({ error: "User already exists" });
    }

    await redisClient.hSet(userKey, {
        name, email, password, role, wallet: "150000"
    });
    res.json({ message: "Registration successful" });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await redisClient.hGetAll(`user:${email}`);

    if (!user.email || user.password !== password) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
        name: user.name,
        email: user.email,
        role: user.role,
        wallet: parseInt(user.wallet)
    });
});

module.exports = router;