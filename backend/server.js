const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redis = require('redis');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// 1. Initialize Redis Client
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
console.log(process.env.REDIS_URL);

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// 2. Initialize Socket.io
const io = new Server(server, {
    cors: {
        // origin: process.env.FRONTEND_URL,
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: "*" }));

// seeding bidding items to the shelves
// 1. Seed with clear time logic
async function seedItems() {
    // Wipe everything first so we don't have duplicate IDs
    await redisClient.flushAll(); 
    
    // Time Constants
    const MINS_45 = 45 * 60 * 1000;
    const ONE_HOUR = 60 * 60 * 1000;
    const TWO_HOURS = 2 * ONE_HOUR;
    const ONE_WEEK = ONE_HOUR * 24 * 7;

    const items = [
        { id: '1', title: "Vintage Rolex Submariner", currentBid: 1000, duration: ONE_HOUR, desc: "Pristine 1970s model with original box." },
        { id: '2', title: "Holographic Charizard 1st Ed", currentBid: 500, duration: TWO_HOURS, desc: "Gem Mint 10. Rare collector item from 1999." },
        { id: '3', title: "Vintage 1970s Leica M4", currentBid: 1450, duration: TWO_HOURS + ONE_WEEK, desc: "A masterpiece of mechanical engineering." },
        { id: '4', title: "SpaceX Starship Fragment", currentBid: 680, duration: MINS_45, desc: "Authenticated piece of heat shield from SN15." },
        { id: '5', title: "Bored Ape Yacht Club #441", currentBid: 92000, duration: ONE_WEEK + ONE_WEEK, desc: "Exclusive digital collectible. Transferred instantly." }
    ];

    for (const item of items) {
        const itemKey = `item:${item.id}`;
        const priceKey = `item:${item.id}:price`;
        const endTimeValue = Date.now() + item.duration;

        // Store metadata in a Hash
        await redisClient.hSet(itemKey, {
            title: item.title,
            currentBid: item.currentBid.toString(),
            auctionEndTime: endTimeValue.toString(),
            lastBidder: 'System',
            description: item.desc 
        });

        // Store the price in a String for atomic bidding
        await redisClient.set(priceKey, item.currentBid.toString());
    }
    console.log("✅ Redis seeded");
}

// 2. API Route with Human-Readable Time
app.get('/items', async (req, res) => {
    try {
        const keys = await redisClient.keys('item:*');
        console.log(keys);
        const items = [];
    
        for (const key of keys) {
            if (key.endsWith(':price')) continue;

            const itemData = await redisClient.hGetAll(key);
            const endTimeMs = parseInt(itemData.auctionEndTime);
            console.log(itemData);
            console.log(endTimeMs);

            items.push({
                id: key.split(':')[1],
                title: itemData.title,
                currentBid: parseInt(itemData.currentBid),
                auctionEndTime: endTimeMs,
                description: itemData.description 
            });
        }
        res.json(items);
    } catch (err) {
        res.status(500).json({error: "Failed to fetch items"});
    }
});

// 4. Real-time Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // When a user sends a bid
    socket.on('BID_PLACED', async (data) => {
        const { itemId, bidAmount, userId } = data;
        const itemKey = `item:${itemId}`; 
        try {
            await redisClient.watch(itemKey);
    
            // Get the current bid from the Hash
            const currentBidStr = await redisClient.hGet(itemKey, 'currentBid');
            const currentPrice = parseInt(currentBidStr) || 0;
    
            if (bidAmount <= currentPrice) {
                await redisClient.unwatch();
                return socket.emit('error', { message: 'Bid too low!' });
            }
    
            // Update the Hash fields atomically
            const results = await redisClient
                .multi()
                .hSet(itemKey, 'currentBid', bidAmount.toString())
                .hSet(itemKey, 'lastBidder', userId)
                .exec();
    
            if (results === null) {
                return socket.emit('error', { message: 'Outbid! Try again.' });
            }
    
            io.emit('UPDATE_BID', { itemId, newBid: bidAmount, bidderId: userId });
        } catch (error) {
            console.error("Bidding Error:", error);
            socket.emit('error', { message: 'Internal Server Error' });
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start Server
const PORT = process.env.PORT || 5050;
async function start() {
    await redisClient.connect();
    console.log("Connected to Redis");
    
    await seedItems();

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

start();