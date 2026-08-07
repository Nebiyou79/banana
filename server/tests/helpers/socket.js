const http = require('http');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const socketHandlers = require('../../src/socket');

let httpServer;
let io;
let port;

async function startSocketServer() {
  if (httpServer) {
    return { httpServer, io, port, connectClient, stopSocketServer };
  }

  httpServer = http.createServer();
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });
  socketHandlers(io);

  await new Promise((resolve) => {
    httpServer.listen(0, resolve);
  });
  port = httpServer.address().port;

  return { httpServer, io, port, connectClient, stopSocketServer };
}

function connectClient(token, opts = {}) {
  if (!port) {
    throw new Error('Call startSocketServer() before connectClient()');
  }

  return ioClient(`http://127.0.0.1:${port}`, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
    ...opts,
  });
}

async function stopSocketServer() {
  if (io) {
    io.close();
    io = null;
  }
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
    httpServer = null;
    port = null;
  }
}

module.exports = { startSocketServer, connectClient, stopSocketServer };
