const { redisClient } = require('../config/redis');

module.exports = (io, socket) => {
    socket.on('BID_PLACED', async (data) => {
        try {
            const { itemId, bidAmount, user } = data;
            if (!user?.email) return socket.emit("error", { message: "Login required" });

            const itemKey = `item:${itemId}`;
            const userKey = `user:${user.email}`;
            const bidsKey = `${itemKey}:bids`;

            await redisClient.watch(itemKey);
            const itemData = await redisClient.hGetAll(itemKey);

            if (itemData.seller === user.email) {
                await redisClient.unwatch();
                return socket.emit('error', { message: 'Cannot bid on your own item!' });
            }

            const currentPrice = parseInt(itemData.currentBid) || 0;
            if (bidAmount <= currentPrice) {
                await redisClient.unwatch();
                return socket.emit('error', { message: 'Bid too low!' });
            }

            const walletBalance = parseInt(await redisClient.hGet(userKey, "wallet")) || 0;
            const prevUserBid = parseInt(await redisClient.hGet(bidsKey, user.email)) || 0;
            const diff = bidAmount - prevUserBid;

            if (walletBalance < diff) {
                await redisClient.unwatch();
                return socket.emit('error', { message: 'Insufficient balance!' });
            }

            const prevHighestBidder = itemData.lastBidder;
            const multi = redisClient.multi();

            multi.hSet(itemKey, { currentBid: bidAmount.toString(), lastBidder: user.email });
            multi.hSet(bidsKey, user.email, bidAmount.toString());
            multi.hIncrBy(userKey, "wallet", -diff);

            if (prevHighestBidder && prevHighestBidder !== 'System' && prevHighestBidder !== user.email) {
                const prevHighestBid = parseInt(await redisClient.hGet(bidsKey, prevHighestBidder)) || 0;
                multi.hIncrBy(`user:${prevHighestBidder}`, "wallet", prevHighestBid);
            }

            const results = await multi.exec();
            if (!results) return socket.emit('error', { message: 'Transaction failed' });

            io.emit('UPDATE_BID', { itemId, newBid: bidAmount, bidderId: user.email });
            io.emit('UPDATE_WALLET', { user: { email: user.email }, newBalance: walletBalance - diff });
        } catch (err) {
            console.error(err);
            socket.emit('error', { message: 'Internal error' });
        }
    });
};