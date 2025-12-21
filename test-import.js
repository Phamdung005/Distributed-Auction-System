// Test import
try {
    const mongodb = require('./shared/database/mongodb');
    console.log('✅ mongodb imported successfully:', typeof mongodb);

    const redis = require('./shared/database/redis');
    console.log('✅ redis imported successfully:', typeof redis.createRedisClient);

} catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
}
