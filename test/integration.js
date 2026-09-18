const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');

const port = 18080;
const testSuffix = `${process.pid}-${Date.now()}`;
const eventConfigPath = path.join(os.tmpdir(), `totem-racing-config-${testSuffix}.json`);
const leaderboardPath = path.join(os.tmpdir(), `totem-racing-leaderboard-${testSuffix}.json`);
const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
  env: { ...process.env, PORT: String(port), MIN_LAP_SECONDS: '0', EVENT_CONFIG_PATH: eventConfigPath, LEADERBOARD_PATH: leaderboardPath },
  stdio: ['ignore', 'pipe', 'inherit']
});

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 5000);
    server.once('exit', code => reject(new Error(`Server exited with code ${code}`)));
    server.stdout.on('data', data => {
      if (!data.toString().includes('Totem controller:')) return;
      clearTimeout(timeout);
      resolve();
    });
  });
}

function connect(query) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://localhost:${port}?${query}`);
    const messages = [];
    const waiters = [];
    socket.on('message', data => {
      const message = JSON.parse(data.toString());
      messages.push(message);
      for (const waiter of [...waiters]) {
        if (!waiter.predicate(message)) continue;
        waiters.splice(waiters.indexOf(waiter), 1);
        clearTimeout(waiter.timeout);
        waiter.resolve(message);
      }
    });
    socket.once('open', () => resolve({ socket, messages, waiters }));
    socket.once('error', reject);
  });
}

function get(pathname) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${pathname}`, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        type: response.headers['content-type'],
        body: Buffer.concat(chunks)
      }));
    }).on('error', reject);
  });
}

function waitFor(client, predicate, timeoutMs = 8000) {
  const existing = client.messages.find(predicate);
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const waiter = { predicate, resolve };
    waiter.timeout = setTimeout(() => {
      client.waiters.splice(client.waiters.indexOf(waiter), 1);
      reject(new Error('Expected WebSocket message timed out'));
    }, timeoutMs);
    client.waiters.push(waiter);
  });
}

function sendCheckpointLap(game, player, speed = 72) {
  for (const checkpoint of [1, 2, 3, 4]) {
    game.socket.send(JSON.stringify({ type: 'checkpoint', player, checkpoint, speed }));
  }
}

async function run() {
  await waitForServer();
  const manifestResponse = await get('/manifest.webmanifest');
  assert.equal(manifestResponse.status, 200);
  assert.equal(JSON.parse(manifestResponse.body).display, 'fullscreen');
  assert.equal((await get('/service-worker.js')).status, 200);
  assert.equal((await get('/operator')).status, 200);
  assert.match((await get('/app-icon.png')).type, /^image\/png/);
  const engineAudio = await get('/engine.mp3');
  assert.equal(engineAudio.status, 200);
  assert.match(engineAudio.type, /^audio\/mpeg/);
  assert.ok(engineAudio.body.length > 0);

  const game = await connect('role=game');
  const operator = await connect('role=operator');
  await waitFor(operator, message => message.type === 'operatorState' && message.state === 'lobby');
  operator.socket.send(JSON.stringify({
    type: 'operatorCommand',
    command: 'config',
    config: { totalLaps: 3, countdownSeconds: 1, finishTimeoutSeconds: 5, resultsDurationSeconds: 5 }
  }));
  await waitFor(operator, message => message.type === 'operatorState' && message.config.countdownSeconds === 1);
  let controller = await connect('role=controller');
  const welcome = await waitFor(controller, message => message.type === 'welcome');
  assert.equal(welcome.player, 1);
  assert.ok(welcome.sessionToken);

  controller.socket.send(JSON.stringify({ type: 'name', name: 'Piloto' }));
  await waitFor(controller, message => message.type === 'nameSaved');
  controller.socket.close();
  await new Promise(resolve => controller.socket.once('close', resolve));

  controller = await connect(`role=controller&session=${encodeURIComponent(welcome.sessionToken)}`);
  const restored = await waitFor(controller, message => message.type === 'welcome');
  assert.equal(restored.player, 1);
  assert.equal(restored.name, 'Piloto');
  assert.equal(restored.reconnected, true);

  const controllerTwo = await connect('role=controller');
  const welcomeTwo = await waitFor(controllerTwo, message => message.type === 'welcome');
  assert.equal(welcomeTwo.player, 2);
  controllerTwo.socket.send(JSON.stringify({ type: 'name', name: 'Rival' }));
  await waitFor(controllerTwo, message => message.type === 'nameSaved');
  controllerTwo.socket.send(JSON.stringify({ type: 'ready', ready: true }));

  controller.socket.send(JSON.stringify({ type: 'ready', ready: true }));
  await waitFor(operator, message => message.type === 'operatorState' && message.players.length === 2 && message.players.every(player => player.ready));
  operator.socket.send(JSON.stringify({ type: 'operatorCommand', command: 'start' }));
  await waitFor(game, message => message.type === 'race' && message.state === 'racing');
  controller.socket.close();
  await new Promise(resolve => controller.socket.once('close', resolve));

  controller = await connect(`role=controller&session=${encodeURIComponent(welcome.sessionToken)}`);
  const raceRestore = await waitFor(controller, message => message.type === 'welcome');
  assert.equal(raceRestore.player, 1);
  assert.equal(raceRestore.name, 'Piloto');
  await waitFor(controller, message => message.type === 'race' && message.state === 'racing');

  game.socket.send(JSON.stringify({ type: 'progress', player: 1, laps: 1, progress: .5, score: 1500000 }));
  game.socket.send(JSON.stringify({ type: 'telemetry', player: 1, speed: 72, x: -1, z: -15 }));
  const telemetry = await waitFor(controller, message => message.type === 'telemetry' && message.speed === 72);
  assert.equal(telemetry.position, 1);
  assert.equal(telemetry.totalPlayers, 2);
  game.socket.send(JSON.stringify({ type: 'respawn', player: 1 }));
  await waitFor(controller, message => message.type === 'respawn');

  game.socket.send(JSON.stringify({ type: 'finish', player: 1, totalTime: 30, bestLap: 9 }));
  game.socket.send(JSON.stringify({ type: 'checkpoint', player: 1, checkpoint: 4 }));
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(controller.messages.some(message => message.type === 'personalResult'), false);

  sendCheckpointLap(game, 1);
  sendCheckpointLap(game, 1);
  await waitFor(controller, message => message.type === 'lastLap');
  sendCheckpointLap(game, 1);
  const winner = await waitFor(controller, message => message.type === 'winnerDeclared');
  assert.equal(winner.player, 1);
  assert.equal(winner.name, 'Piloto');
  const rivalWinnerMessage = await waitFor(controllerTwo, message => message.type === 'winnerDeclared');
  assert.equal(rivalWinnerMessage.player, 1);
  const personalResult = await waitFor(controller, message => message.type === 'personalResult' && message.result.position === 1);
  assert.ok(personalResult.result.totalTime < 5, 'The server must not trust the client finish time.');
  await waitFor(operator, message => message.type === 'operatorState' && message.leaderboard?.some(entry => entry.name === 'Piloto'));

  operator.socket.send(JSON.stringify({ type: 'operatorCommand', command: 'reset' }));
  await waitFor(operator, message => message.type === 'operatorState' && message.state === 'lobby');
  operator.socket.send(JSON.stringify({ type: 'operatorCommand', command: 'kick', player: 1 }));
  await waitFor(controller, message => message.type === 'kicked');

  controller.socket.close();
  controllerTwo.socket.close();
  game.socket.close();
  operator.socket.close();
  console.log('Integration test passed');
}

run()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    server.kill();
    for (const filePath of [eventConfigPath, leaderboardPath]) {
      try { fs.unlinkSync(filePath); } catch (_error) {}
    }
  });
