const http = require('http');

// Configuration
const TARGET_URL = 'http://127.0.0.1:8080/api/auctions/'; // URL to stress test
const CONCURRENCY = 200; // Number of concurrent requests
const DURATION_MS = 300000; // Run for 5 minutes

let successCount = 0;
let errorCount = 0;
let isRunning = true;

const sendRequest = () => {
    if (!isRunning) return;

    const req = http.get(TARGET_URL, (res) => {
        // Just read the data to complete the request
        res.on('data', () => { });
        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                successCount++;
            } else {
                errorCount++;
            }
            // Immediately send another request
            sendRequest();
        });
    });

    req.on('error', (e) => {
        errorCount++;
        // Retry after a small delay on error to avoid crashing
        setTimeout(sendRequest, 100);
    });
};

console.log(`Starting load test on ${TARGET_URL}`);
console.log(`Concurrency: ${CONCURRENCY}, Duration: ${DURATION_MS}ms`);

// Start concurrent workers
for (let i = 0; i < CONCURRENCY; i++) {
    sendRequest();
}

// Stop after duration
setTimeout(() => {
    isRunning = false;
    console.log('\nLoad test finished');
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Rate: ${(successCount / (DURATION_MS / 1000)).toFixed(2)} req/s`);
    process.exit(0);
}, DURATION_MS);

// Status update every second
const statusInterval = setInterval(() => {
    if (!isRunning) {
        clearInterval(statusInterval);
        return;
    }
    process.stdout.write(`Current: ${successCount} success, ${errorCount} errors\r`);
}, 1000);
