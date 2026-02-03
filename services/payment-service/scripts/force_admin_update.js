
const mongoose = require('mongoose');
const User = require('../src/models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateAdminRole() {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@test.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found in Payment Service:', email);
            // Can't create here easily without other data, but let's try to find basic info if needed or just skip
            process.exit(1);
        }

        console.log(`Found user: ${user.email}, Current Role: ${user.role}`);

        user.role = 'admin';
        await user.save();
        await User.updateOne({ email }, { $set: { role: 'admin' } });

        console.log(`✅ Updated user ${email} to role 'admin' in Payment Service`);
        const updatedUser = await User.findOne({ email });
        console.log(`Verification - New Role: ${updatedUser.role}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateAdminRole();
