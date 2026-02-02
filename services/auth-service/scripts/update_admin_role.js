require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const updateRole = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'admin@test.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();
        console.log(`Updated role for ${email} to admin`);
        console.log(`DETAILS:${user.fullName}|${user.phone}`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

updateRole();
