const express = require('express');
const router = express.Router();
const { redisClient } = require('../config/redis');

module.exports = (io) => {
    // GET all items
    router.get('/', async (req, res) => {
        try {
            const keys = await redisClient.keys('item:*');
            const items = [];
            for (const key of keys) {
                if (key.endsWith(':price') || key.includes(':bids') || key.includes(':history')) continue;
                const data = await redisClient.hGetAll(key);
                items.push({
                    id: key.split(':')[1],
                    title: data.title,
                    currentBid: parseInt(data.currentBid),
                    auctionEndTime: parseInt(data.auctionEndTime),
                    description: data.description,
                    lastBidder: data.lastBidder,
                    seller: data.seller || null
                });
            }
            res.json(items);
        } catch (err) { res.status(500).json({ error: "Fetch error" }); }
    });

    // POST new item
    router.post('/', async (req, res) => {
        try {
            const { title, startPrice, days, hours, mins, description, sellerEmail } = req.body;
            const totalMins = (parseInt(days) || 0) * 1440 + (parseInt(hours) || 0) * 60 + (parseInt(mins) || 0);
            
            const itemId = Date.now().toString();
            const endTime = Date.now() + (totalMins * 60 * 1000);

            const newItem = {
                id: itemId,
                title,
                currentBid: startPrice.toString(),
                auctionEndTime: endTime.toString(),
                lastBidder: 'System',
                description: description || "No description",
                seller: sellerEmail
            };

            await redisClient.hSet(`item:${itemId}`, newItem);
            await redisClient.set(`item:${itemId}:price`, startPrice.toString());

            io.emit('NEW_ITEM_ADDED', { ...newItem, currentBid: parseInt(startPrice), auctionEndTime: endTime });
            res.json({ message: "Listed", itemId });
        } catch (err) { res.status(500).json({ error: "Create error" }); }
    });

    return router;
};