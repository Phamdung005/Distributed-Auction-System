/**
 * Scheduler Service
 * Handle scheduled tasks for notifications
 * 
 * NOTE: This service should NOT directly access Auction model.
 * Instead, it listens to events published by auction-service via Redis Pub/Sub.
 * The auction-service is responsible for checking auction times and publishing events.
 */
class SchedulerService {

    /**
     * Start all scheduled jobs
     * Currently minimal - most logic handled by auction-service scheduler
     */
    start() {
        console.log('✅ Scheduler service started (listening to Redis events)');

        // Future: Can add cleanup jobs here
        // Example: Clean up old notifications (already handled by TTL index)
    }
}

module.exports = new SchedulerService();
