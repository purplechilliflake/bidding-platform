const { redisClient } = require('../config/redis');

async function seedItems() {
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
        const exists = await redisClient.exists(itemKey);

        if (!exists) {
            await redisClient.hSet(itemKey, {
                title: item.title,
                currentBid: item.currentBid.toString(),
                auctionEndTime: (Date.now() + item.duration).toString(),
                lastBidder: 'System',
                description: item.desc 
            });
            await redisClient.set(`${itemKey}:price`, item.currentBid.toString());
        } 
    }
    console.log("✅ Seed check complete");
}

module.exports = seedItems;