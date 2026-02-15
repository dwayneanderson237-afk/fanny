/*
  Lightweight live-reload dev server (no external deps)
  - Serves static files from project root
  - Injects a livereload client into HTML responses
  - Uses Server-Sent Events to trigger reload on file changes
*/

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT) || 5173;
const clients = new Set();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const livereloadClient = `(() => {
  const source = new EventSource('/__livereload');
  source.onmessage = (event) => {
    if (event.data === 'reload') {
      window.location.reload();
    }
  };
  source.onerror = () => {
    // quietly retry
  };
})();`;

const server = http.createServer((req, res) => {
  if (!req.url) return;

  if (req.url.startsWith('/__livereload')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('retry: 1000\n\n');
    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
    });
    return;
  }

  if (req.url === '/__livereload.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end(livereloadClient);
    return;
  }

  const safePath = decodeURIComponent(req.url.split('?')[0]);
  const relativePath = safePath === '/' ? '/index.html' : safePath;
  const normalized = path.normalize(relativePath).replace(/^\.+(\/|\\)/, '');
  const filePath = path.join(root, normalized);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    if (ext === '.html') {
      fs.readFile(filePath, 'utf8', (readErr, data) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Server error');
          return;
        }
        const injection = '<script src="/__livereload.js" defer></script>';
        const output = data.includes('</body>')
          ? data.replace('</body>', `${injection}</body>`)
          : `${data}\n${injection}`;

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(output);
      });
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

const broadcastReload = () => {
  clients.forEach((client) => {
    client.write('data: reload\n\n');
  });
};

let debounceTimer;
fs.watch(root, { recursive: true }, (_event, filename) => {
  if (!filename) return;
  if (!/\.(html|css|js)$/.test(filename)) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(broadcastReload, 120);
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Fanny's Bites dev server running at http://localhost:${port}`);
});
