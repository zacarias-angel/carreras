const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const QRCode = require('qrcode');
const { WebSocketServer, WebSocket } = require('ws');

const port = Number(process.env.PORT) || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const players = new Map();

function getLanAddress() {
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) return address.address;
    }
  }
  return 'localhost';
}

const controllerUrl = `http://${getLanAddress()}:${port}/controller`;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/controller', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'controller.html')));
app.get('/qr.svg', async (_req, res, next) => {
  try {
    res.type('image/svg+xml').send(await QRCode.toString(controllerUrl, {
      type: 'svg',
      margin: 1,
      color: { dark: '#07111fff', light: '#ffffffff' }
    }));
  } catch (error) {
    next(error);
  }
});

function send(socket, message) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function broadcastToGames(message) {
  for (const client of wss.clients) {
    if (client.role === 'game') send(client, message);
  }
}

wss.on('connection', (socket, request) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  socket.role = url.searchParams.get('role');

  if (socket.role === 'controller') {
    let player = 1;
    while (players.has(player) && player <= 4) player += 1;
    if (player > 4) {
      send(socket, { type: 'full' });
      socket.close();
      return;
    }
    socket.player = player;
    players.set(player, socket);
    send(socket, { type: 'welcome', player });
    broadcastToGames({ type: 'player', player, connected: true });
  } else if (socket.role === 'game') {
    send(socket, { type: 'ready', players: [...players.keys()] });
  } else {
    socket.close();
    return;
  }

  socket.on('message', (data) => {
    if (socket.role !== 'controller') return;
    try {
      const message = JSON.parse(data.toString());
      if (message.type !== 'input') return;
      broadcastToGames({
        type: 'input',
        player: socket.player,
        steering: Math.max(-1, Math.min(1, Number(message.steering) || 0)),
        throttle: Math.max(-1, Math.min(1, Number(message.throttle) || 0))
      });
    } catch (_error) {
      // Ignore malformed controller packets.
    }
  });

  socket.on('close', () => {
    if (socket.role !== 'controller' || players.get(socket.player) !== socket) return;
    players.delete(socket.player);
    broadcastToGames({ type: 'input', player: socket.player, steering: 0, throttle: 0 });
    broadcastToGames({ type: 'player', player: socket.player, connected: false });
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Totem controller: ${controllerUrl}`);
});
