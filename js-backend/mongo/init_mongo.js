const mongoose = require('mongoose');

const connection = {};

async function dbConnect() {
    if (connection.isConnected) return true;

    try {
        const db = await Promise.race([
            // Database connection attempt
            mongoose.connect(process.env.MONGO_URI),
            // Timeout after 10 seconds
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('DB connection timed out')), 10000);
            }),
        ]);

        connection.isConnected = db.connections[0].readyState;
        return connection.isConnected == 1;
    } catch (err) {
        console.error(err);
        return false;
    }
}

module.exports = {
    dbConnect,
};