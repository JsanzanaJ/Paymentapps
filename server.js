const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 4173);
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - No encontrado');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const cleanPath = req.url.split('?')[0];

  if (cleanPath === '/' || cleanPath === '/admin' || cleanPath === '/admin.html') {
    sendFile(res, path.join(PUBLIC_DIR, 'admin.html'));
    return;
  }

  if (cleanPath === '/persona' || cleanPath === '/persona.html') {
    sendFile(res, path.join(PUBLIC_DIR, 'persona.html'));
    return;
  }

  const requestedPath = path.normalize(path.join(PUBLIC_DIR, cleanPath));
  if (!requestedPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 - Prohibido');
    return;
  }

  sendFile(res, requestedPath);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor listo en http://0.0.0.0:${PORT}`);
  console.log(`Admin:   http://localhost:${PORT}/admin`);
  console.log(`Persona: http://localhost:${PORT}/persona`);
});
