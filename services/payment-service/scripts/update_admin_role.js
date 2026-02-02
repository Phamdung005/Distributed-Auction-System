require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const updateRole = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/payment_db';
        await mongoose.connect(mongoUri);
        console.log(`Connected to DB: ${mongoUri}`);

        const email = 'admin@test.com';
        let user = await User.findOne({ email });

        if (!user) {
            console.log('User not found, creating new user...');
            user = new User({
                email,
                role: 'admin',
                fullName: 'System Administrator',
                phone: '0900000000',
                isActive: true,
                balance: 0
            });
        } else {
            console.log('User found, updating role...');
            user.role = 'admin';
        }

        await user.save();
        console.log(`Successfully synced/updated user ${email} as admin`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

updateRole();
