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
const totalLaps = 3;
let raceState = 'lobby';
let countdownTimer = null;
let lobbyTimer = null;
let raceParticipants = new Set();
let results = [];

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

function broadcast(message) {
  for (const client of wss.clients) send(client, message);
}

function playerState() {
  return [...players.entries()].map(([player, socket]) => ({
    player,
    name: socket.playerName || `P${player}`,
    ready: Boolean(socket.ready)
  }));
}

function sendRaceState(socket) {
  send(socket, {
    type: 'race',
    state: raceState,
    players: playerState(),
    totalLaps
  });
}

function returnToLobby() {
  raceState = 'lobby';
  raceParticipants = new Set();
  results = [];
  for (const socket of players.values()) socket.ready = false;
  broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
}

function startCountdown(hostSocket) {
  if (raceState !== 'lobby' || players.size === 0) return;
  const missingPlayers = [...players.entries()]
    .filter(([, socket]) => !socket.ready)
    .map(([player]) => player);

  if (missingPlayers.length > 0) {
    if (hostSocket) send(hostSocket, { type: 'waiting', missingPlayers });
    return;
  }

  raceState = 'countdown';
  let seconds = 5;
  broadcast({ type: 'race', state: raceState, countdown: seconds, players: playerState(), totalLaps });

  countdownTimer = setInterval(() => {
    seconds -= 1;
    if (seconds > 0) {
      broadcast({ type: 'race', state: raceState, countdown: seconds, players: playerState(), totalLaps });
      return;
    }

    clearInterval(countdownTimer);
    countdownTimer = null;
    raceState = 'racing';
    raceParticipants = new Set(players.keys());
    results = [];
    broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
  }, 1000);
}

function cancelCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
  returnToLobby();
}

wss.on('connection', (socket, request) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  socket.role = url.searchParams.get('role');

  if (socket.role === 'controller') {
    if (raceState !== 'lobby') {
      send(socket, { type: 'locked', state: raceState });
      socket.close();
      return;
    }

    let player = 1;
    while (players.has(player) && player <= 4) player += 1;
    if (player > 4) {
      send(socket, { type: 'full' });
      socket.close();
      return;
    }
    socket.player = player;
    socket.playerName = '';
    socket.ready = false;
    players.set(player, socket);
    send(socket, { type: 'welcome', player, host: player === 1, totalLaps });
    broadcast({ type: 'player', player, connected: true, ready: false });
    broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
  } else if (socket.role === 'game') {
    send(socket, { type: 'ready', players: [...players.keys()], totalLaps });
    sendRaceState(socket);
  } else {
    socket.close();
    return;
  }

  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (socket.role === 'controller') {
        if (message.type === 'name' && raceState === 'lobby') {
          const playerName = String(message.name || '').trim().replace(/\s+/g, ' ').slice(0, 16);
          if (!playerName) {
            send(socket, { type: 'nameError' });
          } else {
            socket.playerName = playerName;
            socket.ready = false;
            send(socket, { type: 'nameSaved', name: playerName });
            broadcast({ type: 'playerName', player: socket.player, name: playerName });
            broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
          }
        }

        if (message.type === 'ready' && raceState === 'lobby') {
          socket.ready = Boolean(message.ready) && Boolean(socket.playerName);
          broadcast({ type: 'playerReady', player: socket.player, ready: socket.ready });
          broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
        }

        if (message.type === 'start' && raceState === 'lobby' && socket.player === 1) {
          if (!socket.playerName) {
            send(socket, { type: 'nameError' });
            return;
          }
          socket.ready = true;
          broadcast({ type: 'playerReady', player: socket.player, ready: true });
          startCountdown(socket);
        }

        if (message.type === 'input') {
          broadcastToGames({
            type: 'input',
            player: socket.player,
            steering: Math.max(-1, Math.min(1, Number(message.steering) || 0)),
            throttle: Math.max(-1, Math.min(1, Number(message.throttle) || 0))
          });
        }
      }

      if (socket.role === 'game' && message.type === 'collision' && Array.isArray(message.players)) {
        for (const player of message.players) {
          const controller = players.get(Number(player));
          if (controller) send(controller, { type: 'vibrate' });
        }
      }

      if (socket.role === 'game' && message.type === 'lap' && raceState === 'racing') {
        const player = Number(message.player);
        const controller = players.get(player);
        const lap = Math.max(1, Math.min(totalLaps, Number(message.lap) || 1));
        const lapTime = Math.max(0, Number(message.lapTime) || 0);
        const totalTime = Math.max(0, Number(message.totalTime) || 0);
        const bestLap = Math.max(0, Number(message.bestLap) || lapTime);
        const lapMessage = { type: 'lap', player, lap, lapTime, totalTime, bestLap, totalLaps };
        if (controller) send(controller, lapMessage);
        broadcastToGames(lapMessage);
      }

      if (socket.role === 'game' && message.type === 'finish' && raceState === 'racing') {
        const player = Number(message.player);
        if (!raceParticipants.has(player) || results.some(result => result.player === player)) return;

        const result = {
          player,
          name: players.get(player)?.playerName || `P${player}`,
          position: results.length + 1,
          totalTime: Math.max(0, Number(message.totalTime) || 0),
          bestLap: Math.max(0, Number(message.bestLap) || 0)
        };
        results.push(result);
        const winnerTime = results[0].totalTime;
        result.difference = Math.max(0, result.totalTime - winnerTime);

        const controller = players.get(player);
        if (controller) send(controller, { type: 'personalResult', result });
        broadcastToGames({ type: 'resultUpdate', result, results });

        if (results.length >= raceParticipants.size) {
          raceState = 'finished';
          broadcast({
            type: 'race',
            state: raceState,
            winner: results[0].player,
            results,
            totalLaps
          });
          if (lobbyTimer) clearTimeout(lobbyTimer);
          lobbyTimer = setTimeout(returnToLobby, 12000);
        }
      }
    } catch (_error) {
      // Ignore malformed controller packets.
    }
  });

  socket.on('close', () => {
    if (socket.role !== 'controller' || players.get(socket.player) !== socket) return;
    players.delete(socket.player);
    broadcastToGames({ type: 'input', player: socket.player, steering: 0, throttle: 0 });
    broadcastToGames({ type: 'player', player: socket.player, connected: false });

    if (raceState === 'countdown') {
      cancelCountdown();
    } else if (raceState === 'lobby') {
      broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
    } else if (raceState === 'racing' && players.size === 0) {
      returnToLobby();
    } else if (raceState === 'racing') {
      raceParticipants.delete(socket.player);
      if (raceParticipants.size > 0 && results.length >= raceParticipants.size) {
        raceState = 'finished';
        broadcast({ type: 'race', state: raceState, winner: results[0]?.player, results, totalLaps });
        lobbyTimer = setTimeout(returnToLobby, 12000);
      }
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Totem controller: ${controllerUrl}`);
});
