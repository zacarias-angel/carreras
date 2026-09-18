const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { WebSocketServer, WebSocket } = require('ws');

const port = Number(process.env.PORT) || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const players = new Map();
const eventConfigPath = process.env.EVENT_CONFIG_PATH || path.join(__dirname, 'event-config.json');
const leaderboardPath = process.env.LEADERBOARD_PATH || path.join(__dirname, 'event-leaderboard.json');
const defaultConfig = { totalLaps: 3, countdownSeconds: 5, finishTimeoutSeconds: 15, resultsDurationSeconds: 12 };

function readJson(filePath, fallback) {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(fallback) ? value : { ...fallback, ...value };
  } catch (_error) {
    return Array.isArray(fallback) ? [...fallback] : { ...fallback };
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

let { totalLaps, countdownSeconds, finishTimeoutSeconds, resultsDurationSeconds } = readJson(eventConfigPath, defaultConfig);
let leaderboard = readJson(leaderboardPath, []);
leaderboard = Array.isArray(leaderboard)
  ? leaderboard.filter(entry => entry && Number.isFinite(entry.totalTime))
  : [];
const reconnectGraceSeconds = 15;
const minimumLapSeconds = process.env.MIN_LAP_SECONDS === undefined
  ? 5
  : Math.max(0, Number(process.env.MIN_LAP_SECONDS) || 0);
let raceState = 'lobby';
let raceStartedAt = 0;
let countdownTimer = null;
let lobbyTimer = null;
let finishTimer = null;
let raceParticipants = new Set();
let results = [];
let raceProgress = new Map();
let lastLapPlayers = new Set();
let checkpointState = new Map();
let pendingFinishes = new Map();
const sessions = new Map();

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
app.get('/operator', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'operator.html')));
app.get('/app-icon.png', (_req, res) => res.sendFile(path.join(__dirname, 'bermuda.png')));
app.get('/engine.mp3', (_req, res) => res.sendFile(path.join(__dirname, '..', 'audiomass-output.mp3')));
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

function raceConfig() {
  return { totalLaps, countdownSeconds, finishTimeoutSeconds, resultsDurationSeconds };
}

function leaderboardState() {
  return [...leaderboard]
    .sort((a, b) => a.totalTime - b.totalTime)
    .slice(0, 10);
}

function saveLeaderboardResult(result) {
  if (!result.completed) return;
  leaderboard.push({ name: result.name, totalTime: result.totalTime, bestLap: result.bestLap, recordedAt: new Date().toISOString() });
  leaderboard = leaderboardState();
  writeJson(leaderboardPath, leaderboard);
}

function operatorState() {
  return {
    type: 'operatorState',
    state: raceState,
    players: playerState(),
    config: raceConfig(),
    results,
    leaderboard: leaderboardState()
  };
}

function broadcastOperatorState() {
  for (const client of wss.clients) {
    if (client.role === 'operator') send(client, operatorState());
  }
}

function broadcast(message) {
  for (const client of wss.clients) send(client, message);
  if (message.type === 'race' || message.type === 'player' || message.type === 'playerReady' || message.type === 'playerName') {
    broadcastOperatorState();
  }
}

function playerState() {
  return [...players.entries()].map(([player, session]) => ({
    player,
    name: session.playerName || `P${player}`,
    ready: Boolean(session.ready),
    connected: Boolean(session.socket)
  }));
}

function sendRaceState(socket) {
  send(socket, {
    type: 'race',
    state: raceState,
    players: playerState(),
    totalLaps,
    config: raceConfig()
  });
}

function returnToLobby() {
  if (finishTimer) clearInterval(finishTimer);
  finishTimer = null;
  raceState = 'lobby';
  raceStartedAt = 0;
  raceParticipants = new Set();
  results = [];
  raceProgress = new Map();
  lastLapPlayers = new Set();
  checkpointState = new Map();
  pendingFinishes = new Map();
  for (const session of players.values()) session.ready = false;
  broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps, config: raceConfig(), leaderboard: leaderboardState() });
}

function finishRace() {
  if (raceState !== 'racing' || results.length === 0) return;
  if (finishTimer) clearInterval(finishTimer);
  finishTimer = null;

  const winnerTime = results[0].totalTime;
  const elapsedTime = winnerTime + finishTimeoutSeconds;
  const unfinished = [...raceParticipants]
    .filter(player => !results.some(result => result.player === player))
    .map(player => ({ player, progress: raceProgress.get(player) || {} }))
    .sort((a, b) => (Number(b.progress.score) || 0) - (Number(a.progress.score) || 0));

  for (const entry of unfinished) {
    const player = entry.player;
    const progress = entry.progress;
    const result = {
      player,
      name: players.get(player)?.playerName || `P${player}`,
      position: results.length + 1,
      totalTime: elapsedTime,
      bestLap: Math.max(0, Number(progress.bestLap) || 0),
      difference: Math.max(0, elapsedTime - winnerTime),
      completed: false
    };
    results.push(result);
    const controller = players.get(player)?.socket;
    if (controller) send(controller, { type: 'personalResult', result });
    broadcastToGames({ type: 'resultUpdate', result, results });
  }

  raceState = 'finished';
  broadcast({
    type: 'race',
    state: raceState,
    winner: results[0].player,
    results,
    totalLaps
  });
  if (lobbyTimer) clearTimeout(lobbyTimer);
  lobbyTimer = setTimeout(returnToLobby, resultsDurationSeconds * 1000);
}

function startFinishTimeout() {
  if (finishTimer) return;
  let seconds = finishTimeoutSeconds;
  broadcast({ type: 'finishCountdown', seconds });

  finishTimer = setInterval(() => {
    seconds -= 1;
    if (seconds <= 0) {
      finishRace();
      return;
    }
    broadcast({ type: 'finishCountdown', seconds });
  }, 1000);
}

function startCountdown(hostSocket) {
  if (raceState !== 'lobby' || players.size === 0) return;
  const missingPlayers = [...players.entries()]
    .filter(([, session]) => !session.ready || !session.socket)
    .map(([player]) => player);

  if (missingPlayers.length > 0) {
    if (hostSocket) send(hostSocket, { type: 'waiting', missingPlayers });
    return;
  }

  raceState = 'countdown';
  let seconds = countdownSeconds;
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
    raceStartedAt = Date.now();
    raceParticipants = new Set(players.keys());
    results = [];
    raceProgress = new Map();
    lastLapPlayers = new Set();
    checkpointState = new Map([...raceParticipants].map(player => [player, { next: 0, laps: 0, lapStartedAt: Date.now() }]));
    pendingFinishes = new Map();
    broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
  }, 1000);
}

function cancelCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
  returnToLobby();
}

function stopRace() {
  if (countdownTimer) clearInterval(countdownTimer);
  if (finishTimer) clearInterval(finishTimer);
  if (lobbyTimer) clearTimeout(lobbyTimer);
  countdownTimer = null;
  finishTimer = null;
  lobbyTimer = null;
  broadcastToGames({ type: 'operatorCommand', command: 'reset' });
  returnToLobby();
}

function kickPlayer(player) {
  const session = players.get(player);
  if (!session) return false;
  if (session.disconnectTimer) clearTimeout(session.disconnectTimer);
  const controller = session.socket;
  session.socket = null;
  if (controller) {
    send(controller, { type: 'kicked' });
    controller.close();
  }
  removeSession(session);
  broadcastOperatorState();
  return true;
}

function updateConfig(config) {
  if (raceState !== 'lobby') return false;
  totalLaps = Math.max(1, Math.min(20, Math.round(Number(config.totalLaps) || totalLaps)));
  countdownSeconds = Math.max(1, Math.min(30, Math.round(Number(config.countdownSeconds) || countdownSeconds)));
  finishTimeoutSeconds = Math.max(3, Math.min(120, Math.round(Number(config.finishTimeoutSeconds) || finishTimeoutSeconds)));
  resultsDurationSeconds = Math.max(3, Math.min(120, Math.round(Number(config.resultsDurationSeconds) || resultsDurationSeconds)));
  writeJson(eventConfigPath, raceConfig());
  broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps, config: raceConfig() });
  return true;
}

function broadcastTelemetry() {
  if (raceState !== 'racing') return;
  const unfinished = [...raceParticipants]
    .filter(player => !results.some(result => result.player === player))
    .sort((a, b) => (Number(raceProgress.get(b)?.score) || 0) - (Number(raceProgress.get(a)?.score) || 0));
  const positions = new Map(results.map(result => [result.player, result.position]));
  unfinished.forEach((player, index) => positions.set(player, results.length + index + 1));

  for (const player of raceParticipants) {
    const progress = raceProgress.get(player) || {};
    const controller = players.get(player)?.socket;
    if (!controller) continue;
    send(controller, {
      type: 'telemetry',
      position: positions.get(player) || raceParticipants.size,
      totalPlayers: raceParticipants.size,
      speed: Math.max(0, Number(progress.speed) || 0),
      lap: Math.max(1, Math.min(totalLaps, Number(progress.laps) + 1 || 1)),
      totalLaps
    });
  }
}

function sendLapState(player, laps, lapTime, totalTime, bestLap) {
  const controller = players.get(player)?.socket;
  const currentLap = Math.min(totalLaps, laps + 1);
  const message = { type: 'lap', player, lap: currentLap, totalLaps, lapTime, totalTime, bestLap };
  if (controller) send(controller, message);
  broadcastToGames(message);

  if (currentLap === totalLaps && !lastLapPlayers.has(player)) {
    lastLapPlayers.add(player);
    const lastLapMessage = { type: 'lastLap', player, name: players.get(player)?.playerName || `P${player}` };
    if (controller) send(controller, lastLapMessage);
    broadcastToGames(lastLapMessage);
  }
}

function recordFinish(message) {
  const player = Number(message.player);
  if (!raceParticipants.has(player) || results.some(result => result.player === player)) return;
  const checkpoints = checkpointState.get(player);
  if (!checkpoints || checkpoints.laps < totalLaps) {
    pendingFinishes.set(player, message);
    return;
  }

  pendingFinishes.delete(player);
  const result = {
    player,
    name: players.get(player)?.playerName || `P${player}`,
    position: results.length + 1,
    totalTime: Math.max(0, (Date.now() - raceStartedAt) / 1000),
    bestLap: Math.max(0, Number(checkpoints.bestLap) || 0),
    completed: true
  };
  results.push(result);
  saveLeaderboardResult(result);
  const winnerTime = results[0].totalTime;
  result.difference = Math.max(0, result.totalTime - winnerTime);

  const controller = players.get(player)?.socket;
  if (controller) send(controller, { type: 'personalResult', result });
  broadcastToGames({ type: 'resultUpdate', result, results });
  if (results.length === 1) {
    broadcast({ type: 'winnerDeclared', player, name: result.name, totalTime: result.totalTime, bestLap: result.bestLap });
  }

  if (results.length >= raceParticipants.size) {
    finishRace();
  } else if (results.length === 1) {
    startFinishTimeout();
  }
}

function processCheckpoint(player, checkpoint) {
  const state = checkpointState.get(player);
  if (!state || checkpoint !== state.next + 1) return;

  if (checkpoint < 4) {
    state.next += 1;
  } else {
    const now = Date.now();
    state.next = 0;
    const lapTime = (now - state.lapStartedAt) / 1000;
    if (lapTime < minimumLapSeconds) {
      state.lapStartedAt = now;
      return;
    }
    state.lapStartedAt = now;
    state.laps += 1;
    state.bestLap = state.bestLap ? Math.min(state.bestLap, lapTime) : lapTime;
    const progress = raceProgress.get(player) || {};
    const totalTime = Math.max(0, (now - raceStartedAt) / 1000);
    raceProgress.set(player, { ...progress, laps: state.laps, totalTime, bestLap: state.bestLap });
    sendLapState(player, state.laps, lapTime, totalTime, state.bestLap);
    if (state.laps >= totalLaps) {
      recordFinish(pendingFinishes.get(player) || {
        player,
        totalTime: Math.max(0, (Date.now() - raceStartedAt) / 1000),
        bestLap: state.bestLap
      });
    }
  }
}

function removeSession(session) {
  if (players.get(session.player) !== session) return;
  players.delete(session.player);
  sessions.delete(session.token);
  broadcastToGames({ type: 'player', player: session.player, connected: false });

  if (raceState === 'countdown') {
    cancelCountdown();
  } else if (raceState === 'lobby') {
    broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
  } else if (raceState === 'racing') {
    if (players.size === 0) {
      returnToLobby();
    } else if (results.length >= raceParticipants.size) {
      finishRace();
    }
  }
}

function attachController(socket, session, reconnected) {
  if (session.disconnectTimer) clearTimeout(session.disconnectTimer);
  if (session.socket && session.socket !== socket) session.socket.close();
  session.disconnectTimer = null;
  session.socket = socket;
  socket.session = session;
  socket.player = session.player;

  send(socket, {
    type: 'welcome',
    player: session.player,
    host: session.player === 1,
    totalLaps,
    sessionToken: session.token,
    name: session.playerName,
    ready: session.ready,
    reconnected
  });
  sendRaceState(socket);

  const result = results.find(entry => entry.player === session.player);
  if (result) send(socket, { type: 'personalResult', result });
  if (raceState === 'racing' && lastLapPlayers.has(session.player)) {
    send(socket, { type: 'lastLap', player: session.player, name: session.playerName || `P${session.player}` });
  }
  if (results.length > 0) {
    send(socket, {
      type: 'winnerDeclared',
      player: results[0].player,
      name: results[0].name,
      totalTime: results[0].totalTime,
      bestLap: results[0].bestLap
    });
  }
  broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
}

wss.on('connection', (socket, request) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  socket.role = url.searchParams.get('role');

  if (socket.role === 'controller') {
    const requestedToken = url.searchParams.get('session');
    const existingSession = requestedToken && sessions.get(requestedToken);
    if (existingSession) {
      attachController(socket, existingSession, true);
    } else {
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
      const session = {
        token: crypto.randomUUID(),
        player,
        playerName: '',
        ready: false,
        socket: null,
        disconnectTimer: null
      };
      players.set(player, session);
      sessions.set(session.token, session);
      attachController(socket, session, false);
      broadcast({ type: 'player', player, connected: true, ready: false });
    }
  } else if (socket.role === 'game') {
    send(socket, { type: 'ready', players: [...players.keys()], totalLaps });
    sendRaceState(socket);
  } else if (socket.role === 'operator') {
    send(socket, operatorState());
  } else {
    socket.close();
    return;
  }

  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (socket.role === 'controller') {
        const session = socket.session;
        if (message.type === 'name' && raceState === 'lobby') {
          const playerName = String(message.name || '').trim().replace(/\s+/g, ' ').slice(0, 16);
          if (!playerName) {
            send(socket, { type: 'nameError' });
          } else {
            session.playerName = playerName;
            session.ready = false;
            send(socket, { type: 'nameSaved', name: playerName });
            broadcast({ type: 'playerName', player: session.player, name: playerName });
            broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
          }
        }

        if (message.type === 'ready' && raceState === 'lobby') {
          session.ready = Boolean(message.ready) && Boolean(session.playerName);
          broadcast({ type: 'playerReady', player: session.player, ready: session.ready });
          broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
        }

        if (message.type === 'start' && raceState === 'lobby' && session.player === 1) {
          if (!session.playerName) {
            send(socket, { type: 'nameError' });
            return;
          }
          session.ready = true;
          broadcast({ type: 'playerReady', player: session.player, ready: true });
          startCountdown(socket);
        }

        if (message.type === 'input') {
          broadcastToGames({
            type: 'input',
            player: session.player,
            steering: Math.max(-1, Math.min(1, Number(message.steering) || 0)),
            throttle: Math.max(-1, Math.min(1, Number(message.throttle) || 0))
          });
        }
      }

      if (socket.role === 'game' && message.type === 'collision' && Array.isArray(message.players)) {
        for (const player of message.players) {
          const controller = players.get(Number(player))?.socket;
          if (controller) send(controller, { type: 'vibrate' });
        }
      }

      if (socket.role === 'game' && message.type === 'lap' && raceState === 'racing') {
        const player = Number(message.player);
        const controller = players.get(player)?.socket;
        const lapTime = Math.max(0, Number(message.lapTime) || 0);
        const totalTime = Math.max(0, Number(message.totalTime) || 0);
        const bestLap = Math.max(0, Number(message.bestLap) || lapTime);
        const previousProgress = raceProgress.get(player) || {};
        raceProgress.set(player, { ...previousProgress, bestLap, totalTime });
        const validatedLaps = checkpointState.get(player)?.laps || 0;
        const lap = Math.min(totalLaps, validatedLaps + 1);
        const lapMessage = { type: 'lap', player, lap, lapTime, totalTime, bestLap, totalLaps };
        if (controller) send(controller, lapMessage);
        broadcastToGames(lapMessage);
      }

      if (socket.role === 'game' && message.type === 'progress' && raceState === 'racing') {
        const player = Number(message.player);
        if (raceParticipants.has(player)) {
          const previousProgress = raceProgress.get(player) || {};
          const laps = checkpointState.get(player)?.laps || 0;
          const progress = Math.max(0, Math.min(1, Number(message.progress) || 0));
          raceProgress.set(player, {
            ...previousProgress,
            laps,
            progress,
            score: laps * 1000000 + progress,
            bestLap: Math.max(0, Number(message.bestLap) || previousProgress.bestLap || 0)
          });
          broadcastTelemetry();
        }
      }

      if (socket.role === 'game' && message.type === 'telemetry' && raceState === 'racing') {
        const player = Number(message.player);
        if (raceParticipants.has(player)) {
          const previousProgress = raceProgress.get(player) || {};
          raceProgress.set(player, { ...previousProgress, speed: Math.max(0, Number(message.speed) || 0) });
          broadcastTelemetry();
        }
      }

      if (socket.role === 'game' && message.type === 'checkpoint' && raceState === 'racing') {
        const player = Number(message.player);
        const checkpoint = Math.round(Number(message.checkpoint));
        if (raceParticipants.has(player) && checkpoint >= 1 && checkpoint <= 4) {
          processCheckpoint(player, checkpoint);
          broadcastTelemetry();
        }
      }

      if (socket.role === 'game' && message.type === 'respawn' && raceState === 'racing') {
        const player = Number(message.player);
        const controller = players.get(player)?.socket;
        if (controller) send(controller, { type: 'respawn' });
      }

      if (socket.role === 'game' && message.type === 'finish' && raceState === 'racing') {
        recordFinish(message);
      }

      if (socket.role === 'operator' && message.type === 'operatorCommand') {
        if (message.command === 'start') startCountdown(socket);
        if (message.command === 'stop' || message.command === 'reset') stopRace();
        if (message.command === 'kick') kickPlayer(Number(message.player));
        if (message.command === 'config') updateConfig(message.config || {});
        send(socket, operatorState());
      }
    } catch (_error) {
      // Ignore malformed controller packets.
    }
  });

  socket.on('close', () => {
    const session = socket.session;
    if (socket.role !== 'controller' || !session || session.socket !== socket) return;
    session.socket = null;
    broadcastToGames({ type: 'input', player: session.player, steering: 0, throttle: 0 });
    broadcast({ type: 'race', state: raceState, players: playerState(), totalLaps });
    session.disconnectTimer = setTimeout(() => removeSession(session), reconnectGraceSeconds * 1000);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Totem controller: ${controllerUrl}`);
});
