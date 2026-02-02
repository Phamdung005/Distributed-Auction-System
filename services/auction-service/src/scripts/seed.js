const mongoose = require('mongoose');
const Auction = require('../models/Auction');
require('dotenv').config();

// Configuration
// Use port 27018 from host if running locally against docker container
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/auction_db';

// Dummy Seller ID (Replace with a real User ID from your Auth Service if needed)
// Use a fixed ID so we can refer to it
const SELLER_ID = '65ba3d528b93995818987654';

const sampleAuctions = [
    {
        title: "iPhone 15 Pro Max 256GB - Natural Titanium",
        description: "Điện thoại mới 99%, còn bảo hành chính hãng Apple Việt Nam đến tháng 10/2026. Fullbox đầy đủ phụ kiện.",
        images: ["https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg", "https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-black-thumbnew-600x600.jpg"],
        category: "electronics",
        startPrice: 24000000,
        minBidIncrement: 500000,
        buyNowPrice: 30000000,
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started 1 day ago
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
        status: "active",
        condition: "like-new",
        seller: SELLER_ID
    },
    {
        title: "MacBook Pro M3 14 inch",
        description: "MacBook Pro M3 bản base, màu Silver. Cycle count 10. Mới active được 2 tuần.",
        images: ["https://cdn.tgdd.vn/Products/Images/44/318229/macbook-pro-14-inch-m3-2023-16gb-gray-thumb-600x600.jpg"],
        category: "electronics",
        startPrice: 35000000,
        minBidIncrement: 1000000,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
        endTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // Ends in 5 hours
        status: "active",
        condition: "new",
        seller: SELLER_ID
    },
    {
        title: "Xe máy Honda SH 150i ABS 2023",
        description: "Xe chính chủ, biển Hà Nội. Odo 5000km. Bảo dưỡng định kỳ tại Head.",
        images: ["https://cdn.honda.com.vn/motorbike-versions/August2023/1y5GjY3b6yu3b5u6y5t6.png"],
        category: "vehicles",
        startPrice: 80000000,
        minBidIncrement: 2000000,
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Started 3 days ago
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // Ends in 12 hours
        status: "active",
        condition: "used",
        seller: SELLER_ID
    },
    {
        title: "Đồng hồ Apple Watch Series 9 GPS 41mm",
        description: "Màu hồng, dây cao su. Chưa kích hoạt bảo hành.",
        images: ["https://cdn.tgdd.vn/Products/Images/54/314666/apple-watch-s9-gps-41mm-hong-thumb-1-600x600.jpg"],
        category: "electronics",
        startPrice: 8000000,
        minBidIncrement: 200000,
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // Starts in 2 hours
        endTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // Ends in 26 hours
        status: "pending",
        condition: "new",
        seller: SELLER_ID
    },
    {
        title: "Giày Nike Air Jordan 1 High OG Lost & Found",
        description: "Size 42. Legit check thoải mái. Full box, bill.",
        images: ["https://secure-images.nike.com/is/image/DotCom/DZ5485_612_A_PREM?$SNKRS_COVER_WD$&align=0,1"],
        category: "fashion",
        startPrice: 9000000,
        minBidIncrement: 100000,
        startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Started 10 days ago
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Ended 1 day ago
        status: "ended",
        condition: "new",
        seller: SELLER_ID
    },
    {
        title: "Laptop Gaming ASUS ROG Strix G15",
        description: "RTX 3060, Ryzen 7 5800H. Màn hình 144Hz. Đã nâng cấp RAM lên 32GB.",
        images: ["https://cdn.tgdd.vn/Products/Images/44/283654/asus-rog-strix-gaming-g513ih-r7-hn015w-600x600.jpg"],
        category: "electronics",
        startPrice: 18000000,
        minBidIncrement: 500000,
        startTime: new Date(Date.now() + 30 * 60 * 1000), // Starts in 30 mins
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Ends in 24 hours
        status: "pending",
        condition: "used",
        seller: SELLER_ID
    },
    {
        title: "Máy ảnh Sony Alpha A6400 Body",
        description: "Chụp 10k shot. Ngoại hình đẹp. Sensor sạch.",
        images: ["https://binhminhdigital.com/StoreData/Product/12316/Sony-A6400-Body-(Black)-binhminhdigital.jpg"],
        category: "electronics",
        startPrice: 15500000,
        minBidIncrement: 100000,
        startTime: new Date(Date.now() - 60 * 60 * 1000), // Active
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        status: "active",
        condition: "used",
        seller: SELLER_ID
    },
    {
        title: "Test Auction - Ends in 5 Minutes",
        description: "This auction is for testing order creation. Ends in 5 minutes. Bid now!",
        images: ["https://plus.unsplash.com/premium_photo-1683141154082-324d296f3c66?q=80&w=2940&auto=format&fit=crop"],
        category: "other",
        startPrice: 100000,
        minBidIncrement: 10000,
        startTime: new Date(Date.now() - 1 * 60 * 1000), // Started 1 min ago
        endTime: new Date(Date.now() + 5 * 60 * 1000), // Ends in 5 mins
        status: "active",
        condition: "new",
        seller: SELLER_ID
    }
];

const seedDB = async () => {
    try {
        console.log('Connecting to MongoDB at:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing auctions? Uncomment if you want to wipe DB
        // await Auction.deleteMany({});
        // console.log('Cleared existing auctions');

        // Insert new auctions
        const result = await Auction.insertMany(sampleAuctions);
        console.log(`Seeded ${result.length} auctions`);

        console.log('ℹUse this Seller ID for your user in Auth Service if you want to manage these:', SELLER_ID);

        await mongoose.connection.close();
        console.log('Connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
