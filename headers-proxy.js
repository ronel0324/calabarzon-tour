const http = require('http');
const net = require('net');

const TARGET_PORT = 8081; // port ng Expo
const PORT = 8082;        // dito ka magbubukas

const server = http.createServer((req, res) => {
  const proxyReq = http.request(
    { host: 'localhost', port: TARGET_PORT, path: req.url, method: req.method, headers: req.headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      });
      proxyRes.pipe(res);
    }
  );
  proxyReq.on('error', () => { res.statusCode = 502; res.end('Proxy error'); });
  req.pipe(proxyReq);
});

// para gumana pa rin ang hot reload (websocket)
server.on('upgrade', (req, socket, head) => {
  const upstream = net.connect(TARGET_PORT, 'localhost', () => {
    const lines = Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n');
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${lines}\r\n\r\n`);
    upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
});

server.listen(PORT, () => console.log(`Buksan: http://localhost:${PORT}`));