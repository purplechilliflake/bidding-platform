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
    url: process.env.REDIS_URL
});

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
    await redisClient.flushAll(); 
    
    // Define standard offsets
    const ONE_HOUR = 60 * 60 * 1000;
    const TWO_HOURS = 2 * ONE_HOUR;

    const items = [
        { id: '1', title: "Vintage Rolex", currentBid: 1000, duration: ONE_HOUR },
        { id: '2', title: "Charizard Card", currentBid: 500, duration: TWO_HOURS }
    ];

    for (const item of items) {
        const itemKey = `item:${item.id}`;
        const endTime = Date.now() + item.duration;  // Standard Unix Timestamp
        console.log(endTime.toString());

        await redisClient.hSet(itemKey, {
            title: item.title,
            currentBid: item.currentBid.toString(),
            auctionEndTime: endTime.toString(), // We store the number as a string in Redis
            lastBidder: 'System'
        });
    }
    console.log("✅ Redis seeded with Standard Timestamps");
}

// 2. API Route with Human-Readable Time
app.get('/items', async (req, res) => {
    try {
        const keys = await redisClient.keys('item:[0-9]*');
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
                auctionEndTime: endTimeMs
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
        const itemKey = `item:${itemId}:price`;

        try {
            // 1. WATCH the key to detect changes (Concurrency Control)
            await redisClient.watch(itemKey);

            // 2. Get the current bid from Redis
            const currentBid = await redisClient.get(itemKey);
            const currentPrice = parseInt(currentBid) || 0;

            // 3. Validation
            if (bidAmount <= currentPrice) {
                await redisClient.unwatch();
                return socket.emit('error', { message: 'Bid too low!' });
            }

            // 4. Try to update Redis atomically
            const results = await redisClient
                .multi()
                .set(itemKey, bidAmount)
                .set(`item:${itemId}:lastBidder`, userId)
                .exec();

            if (results === null) {
                // Someone else beat us to it between the WATCH and the EXEC!
                return socket.emit('error', { message: 'Outbid! Someone else just placed a bid.' });
            }

            // 5. Success! Tell EVERYONE connected about the new bid
            io.emit('UPDATE_BID', {
                itemId,
                newBid: bidAmount,
                bidderId: userId
            });

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