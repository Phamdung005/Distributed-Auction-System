const path = require('path');
const mongoose = require('../services/auth-service/node_modules/mongoose');
const bcrypt = require('../services/auth-service/node_modules/bcryptjs');

// Database connection URIs
const AUTH_DB_URI = 'mongodb://localhost:27017/auth_db';
const PAYMENT_DB_URI = 'mongodb://localhost:27020/payment_db';

async function seedAdmin() {
    try {
        console.log('=== 1. KHỞI TẠO TÀI KHOẢN ADMIN TRONG AUTH_DB ===');
        await mongoose.connect(AUTH_DB_URI);
        console.log('Connected to Auth Database successfully.');

        // Define Auth User Schema inline to avoid dependency path issues
        const authSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            fullName: { type: String, required: true },
            phone: { type: String },
            role: { type: String, enum: ['seller', 'bidder', 'admin'], default: 'bidder' },
            isActive: { type: Boolean, default: true }
        }, { collection: 'users', timestamps: true });

        // Compile Auth Model
        const AuthUser = mongoose.models.User || mongoose.model('User', authSchema);

        const email = 'admin@test.com';
        const passwordPlain = 'Password123';
        
        let authUser = await AuthUser.findOne({ email });
        
        if (!authUser) {
            console.log(`User ${email} not found in AuthDB. Creating new...`);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(passwordPlain, salt);
            
            authUser = await AuthUser.create({
                email,
                password: hashedPassword,
                fullName: 'System Administrator',
                phone: '0900000000',
                role: 'admin',
                isActive: true
            });
            console.log('✅ Admin user created in Auth Database.');
        } else {
            console.log(`User ${email} already exists in AuthDB. Promoting to 'admin'...`);
            authUser.role = 'admin';
            authUser.isActive = true;
            await authUser.save();
            console.log('✅ Admin user updated in Auth Database.');
        }

        // Close connection to Auth Database
        await mongoose.connection.close();
        console.log('Auth Database connection closed.\n');

        console.log('=== 2. KHỞI TẠO TÀI KHOẢN ADMIN TRONG PAYMENT_DB ===');
        await mongoose.connect(PAYMENT_DB_URI);
        console.log('Connected to Payment Database successfully.');

        // Define Payment User Schema inline
        const paymentSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            fullName: { type: String, required: true },
            phone: { type: String },
            role: { type: String, enum: ['seller', 'bidder', 'admin'], default: 'bidder' },
            balance: { type: Number, default: 0 },
            isActive: { type: Boolean, default: true }
        }, { collection: 'users', timestamps: true });

        // Compile Payment Model
        const PaymentUser = mongoose.models.PaymentUser || mongoose.model('PaymentUser', paymentSchema);

        let paymentUser = await PaymentUser.findOne({ email });

        if (!paymentUser) {
            console.log(`User ${email} not found in PaymentDB. Creating new...`);
            paymentUser = await PaymentUser.create({
                _id: authUser._id, // Match IDs
                email,
                fullName: 'System Administrator',
                phone: '0900000000',
                role: 'admin',
                balance: 10000000, // Pre-funded with 10 Million VND for testing
                isActive: true
            });
            console.log('✅ Admin user synced/created in Payment Database.');
        } else {
            console.log(`User ${email} already exists in PaymentDB. Promoting to 'admin'...`);
            paymentUser.role = 'admin';
            paymentUser.isActive = true;
            await paymentUser.save();
            console.log('✅ Admin user updated in Payment Database.');
        }

        await mongoose.connection.close();
        console.log('Payment Database connection closed.');
        console.log('\n🎉 ĐÃ THIẾT LẬP THÀNH CÔNG TÀI KHOẢN ADMIN!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${passwordPlain}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding admin account:', error);
        process.exit(1);
    }
}

seedAdmin();
