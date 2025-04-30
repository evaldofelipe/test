const WebSocket = require('ws');
const http = require('http'); // Import the http module
const geoip = require('geoip-lite'); // Import geoip-lite

// --- Configuration ---
const PINGPONG_PATH = '/pingpong';
const REQUIRED_HEADER = 'x-pingpong-request'; // Headers are lowercased by Node.js http module
const EXPECTED_PING_BODY = 'ping';
const PONG_RESPONSE_BODY = 'pong';
// --- End Configuration ---

// Create an HTTP server
const server = http.createServer((req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const geo = geoip.lookup(clientIp);
    const country = geo ? geo.country : 'Unknown';

    // Log more details: Method, URL, IP, Country, and Headers
    console.log(`HTTP Request: ${req.method} ${req.url} from ${clientIp} (${country})`);
    console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`); // Log headers

    // --- Handle Root Path ---
    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hello! This is an HTTP server. WebSocket is available too.\n');
    }
    // --- Handle PingPong Path ---
    else if (req.url === PINGPONG_PATH && req.method === 'POST') {
        const hasRequiredHeader = req.headers[REQUIRED_HEADER] === 'true';
        if (!hasRequiredHeader) {
            console.log(`[HTTP PingPong] Rejected: Missing or incorrect header '${REQUIRED_HEADER}' from ${clientIp}`);
            res.writeHead(400, { 'Content-Type': 'text/plain' }); // 400 Bad Request
            res.end(`Header '${REQUIRED_HEADER}: true' is required.`);
            return;
        }

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
            // Optional: Limit body size to prevent abuse
            if (body.length > 1e4) { // Limit to 10KB
                 console.log(`[HTTP PingPong] Rejected: Request body too large from ${clientIp}`);
                 req.connection.destroy();
            }
        });
        req.on('end', () => {
            if (body === EXPECTED_PING_BODY) {
                console.log(`[HTTP PingPong] Received '${EXPECTED_PING_BODY}' from ${clientIp}, sending '${PONG_RESPONSE_BODY}'...`);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(PONG_RESPONSE_BODY);
            } else {
                console.log(`[HTTP PingPong] Rejected: Incorrect body '${body}' from ${clientIp}. Expected '${EXPECTED_PING_BODY}'.`);
                res.writeHead(400, { 'Content-Type': 'text/plain' }); // 400 Bad Request
                res.end(`Request body must be '${EXPECTED_PING_BODY}'.`);
            }
        });
         req.on('error', (err) => {
            console.error(`[HTTP PingPong] Request error from ${clientIp}: ${err}`);
            res.writeHead(500);
            res.end();
        });

    } else if (req.url === PINGPONG_PATH && req.method !== 'POST') {
         console.log(`[HTTP PingPong] Rejected: Method ${req.method} not allowed for ${PINGPONG_PATH} from ${clientIp}`);
         res.writeHead(405, { 'Content-Type': 'text/plain', 'Allow': 'POST' }); // 405 Method Not Allowed
         res.end('Method Not Allowed. Use POST.');
    }
    // --- Handle Not Found ---
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Create WebSocket server (basic functionality) - remove verifyClient
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    // Get the client's IP address from the request
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const geo = geoip.lookup(clientIp);
    const country = geo ? geo.country : 'Unknown';

    console.log(`New WebSocket connection from ${clientIp} (${country}) (Path: ${req.url})`); // Log path too

    // Send the IP address and country to the client
    ws.send(`Your IP address is: ${clientIp} (${country}) - WebSocket Connected`);

    // Optional: Basic message echo for WebSocket testing (no ping-pong)
    ws.on('message', (message) => {
        const messageString = message.toString();
        console.log(`[WebSocket] Received: ${messageString} from ${clientIp} (${country})`);
        // ws.send(`Echo: ${messageString}`); // Example echo
    });

    // Handle connection close
    ws.on('close', () => {
        console.log(`WebSocket connection from ${clientIp} (${country}) closed.`);
    });
});
