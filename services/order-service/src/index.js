const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('shared/database/mongodb');
const subscribeToEvents = require('./events/subscriber');
const orderRoutes = require('./routes/order.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3007;

const initializeApp = async () => {
    try {
        await connectDB(process.env.MONGODB_URI);

        // Subscribe to events
        await subscribeToEvents();

        console.log('✅ Services initialized');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        process.exit(1);
    }
};

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'order-service' });
});

app.use('/api/orders', orderRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

initializeApp().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Order Service running on port ${PORT}`);
    });
});

// Handle shutdown
process.on('SIGTERM', () => {
    process.exit(0);
});
