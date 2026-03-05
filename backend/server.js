const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { connectRedis } = require('./config/redis');
const seedItems = require('./utils/seed');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const bidHandler = require('./sockets/bidHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Routes
app.use('/', authRoutes);
app.use('/items', itemRoutes(io));

// Sockets
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    bidHandler(io, socket);
    socket.on('disconnect', () => console.log('User disconnected'));
});

const PORT = process.env.PORT || 5050;

async function start() {
    await connectRedis();
    await seedItems();
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();