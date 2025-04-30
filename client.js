const http = require('http');

// --- Configuration ---
// Use the SERVER_IP environment variable, or default to the hardcoded IP
const SERVER_IP = process.env.SERVER_IP || 'localhost'; // IP address of the main websocket/http server
const SERVER_PORT = process.env.SERVER_PORT || 8080;          // Port of the main websocket/http server
const HEALTH_CHECK_PORT = 8081;   // Port for the client's own health check server
const PINGPONG_PATH = '/pingpong'; // The specific path for pingpong
const CUSTOM_HEADER_NAME = 'X-PingPong-Request'; // Use standard casing for sending
const CUSTOM_HEADER_VALUE = 'true';
const PING_BODY = 'ping';
const REQUEST_INTERVAL_MS = 3000; // 3 seconds
// --- End Configuration ---

// --- HTTP PingPong Request Logic ---
const targetServerOptions = {
    hostname: SERVER_IP,
    port: SERVER_PORT,
    path: PINGPONG_PATH,
    method: 'POST',
    headers: {
        [CUSTOM_HEADER_NAME]: CUSTOM_HEADER_VALUE,
        'Content-Type': 'text/plain',
        // 'Content-Length': Buffer.byteLength(PING_BODY) // Node automatically calculates this
    }
};

function makeRequest() {
    console.log(`Sending HTTP POST request to http://${SERVER_IP}:${SERVER_PORT}${PINGPONG_PATH} with body "${PING_BODY}"...`);

    const req = http.request(targetServerOptions, (res) => {
        let data = '';

        console.log(`[HTTP PingPong] STATUS: ${res.statusCode}`);
        // console.log(`[HTTP PingPong] HEADERS: ${JSON.stringify(res.headers)}`);

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            // Only log as "pong" if status is 200 and body matches
            if (res.statusCode === 200 && data === 'pong') {
                 console.log(`[HTTP PingPong] Received: ${data.trim()}`);
            } else {
                 console.log(`[HTTP PingPong] Received unexpected response: Status ${res.statusCode}, Body: ${data.trim()}`);
            }
            console.log('-------------------------');
        });
         res.on('error', (e) => { // Handle errors on the response stream
            console.error(`[HTTP PingPong] Problem with response: ${e.message}`);
            console.log('-------------------------');
        });
    });

    req.on('error', (e) => { // Handle errors sending the request
        console.error(`[HTTP PingPong] Problem with request: ${e.message}`);
        console.log('-------------------------');
    });

    // Write the body data
    req.write(PING_BODY);
    req.end(); // Finalize the request
}
// --- End HTTP PingPong Request Logic ---


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
console.log(`Client starting. Will send HTTP POST to ${SERVER_IP}:${SERVER_PORT}${PINGPONG_PATH} every ${REQUEST_INTERVAL_MS / 1000} seconds.`);

// Run the first request immediately
makeRequest();

// Schedule subsequent requests
setInterval(makeRequest, REQUEST_INTERVAL_MS);
// --- End Main Client Logic --- 
