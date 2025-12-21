const mongoose = require('mongoose');

/**
 * Kết nối đến MongoDB
 * @param {string} uri - MongoDB connection string
 * @returns {Promise<void>}
 */
const connectDB = async (uri) => {
    try {
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(uri, options);
        console.log('✅ MongoDB đã kết nối thành công');

        // Lắng nghe các event
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB đã ngắt kết nối');
        });

    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
