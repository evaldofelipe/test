const http = require('http');

// --- Configuration ---
// Use the SERVER_IP environment variable, or default to the hardcoded IP
const SERVER_IP = process.env.SERVER_IP || '64.226.77.246'; // IP address of the main websocket/http server
const SERVER_PORT = 8080;          // Port of the main websocket/http server
const REQUEST_INTERVAL_MS = 3000; // 3 seconds
const HEALTH_CHECK_PORT = 8080;   // Port for the client's own health check server
// --- End Configuration ---

const targetServerOptions = {
    hostname: SERVER_IP,
    port: SERVER_PORT,
    path: '/', // Request the root path
    method: 'GET',
};

function makeRequest() {
    console.log(`Sending request to http://${SERVER_IP}:${SERVER_PORT}...`);

    const req = http.request(targetServerOptions, (res) => {
        let data = '';

        console.log(`[Target Server] STATUS: ${res.statusCode}`);
        // console.log(`[Target Server] HEADERS: ${JSON.stringify(res.headers)}`);

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(`[Target Server] RESPONSE BODY: ${data.trim()}`);
            console.log('-------------------------');
        });
    });

    req.on('error', (e) => {
        console.error(`[Target Server] Problem with request: ${e.message}`);
        console.log('-------------------------');
    });

    req.end();
}

// --- Health Check Server ---
const healthServer = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        console.log(`[Health Check] Served ${req.method} ${req.url} - Status 200`);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        console.log(`[Health Check] Served ${req.method} ${req.url} - Status 404`);
    }
});

healthServer.listen(HEALTH_CHECK_PORT, '0.0.0.0', () => {
    console.log(`[Health Check] Server listening on port ${HEALTH_CHECK_PORT}`);
});

healthServer.on('error', (err) => {
    console.error(`[Health Check] Server error: ${err}`);
    // Optionally exit if the health check server fails critically
    // process.exit(1);
});
// --- End Health Check Server ---


// --- Start Main Client Logic ---
console.log(`Client starting. Will send request to ${SERVER_IP}:${SERVER_PORT} every ${REQUEST_INTERVAL_MS / 1000} seconds.`);

// Run the first request immediately
makeRequest();

// Schedule subsequent requests
setInterval(makeRequest, REQUEST_INTERVAL_MS);
// --- End Main Client Logic --- 
