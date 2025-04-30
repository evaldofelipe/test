const WebSocket = require('ws');
const http = require('http'); // Import the http module
const geoip = require('geoip-lite'); // Import geoip-lite

// Create an HTTP server
const server = http.createServer((req, res) => {
    // Get client IP - check proxy header first
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const geo = geoip.lookup(clientIp);
    const country = geo ? geo.country : 'Unknown'; // Get country code (e.g., 'US')

    console.log(`HTTP Request: ${req.method} ${req.url} from ${clientIp} (${country})`);

    // Handle regular HTTP requests here
    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hello! This is an HTTP server. WebSocket is available too.\n');
    } else {
        res.writeHead(404);
        res.end();
    }
});

// Create WebSocket server and attach it to the HTTP server
const wss = new WebSocket.Server({ server }); // Use the 'server' option

wss.on('connection', (ws, req) => {
    // Get the client's IP address from the request
    // For connections proxied (like through Nginx), you might need 'x-forwarded-for' header
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const geo = geoip.lookup(clientIp);
    const country = geo ? geo.country : 'Unknown'; // Get country code

    console.log(`New WebSocket connection from ${clientIp} (${country})`);

    // Send the IP address and country to the client
    ws.send(`Your IP address is: ${clientIp} (${country})`);

    // Handle messages from client (optional)
    ws.on('message', (message) => {
        // Ensure message is treated as a string for logging
        const messageString = message.toString();
        console.log(`Received: ${messageString} from ${clientIp} (${country})`);
    });

    // Handle connection close
    ws.on('close', () => {
        console.log(`WebSocket connection from ${clientIp} (${country}) closed`);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.log(`WebSocket error with ${clientIp} (${country}): ${error}`);
    });
});

// Start the HTTP server (which also handles WebSocket upgrades)
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`HTTP and WebSocket server running on http://localhost:${PORT} and ws://localhost:${PORT}`);
});
