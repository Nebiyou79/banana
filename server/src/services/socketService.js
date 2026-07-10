// server/src/services/socketService.js
/**
 * Singleton wrapper to expose the Socket.IO server instance to services.
 */
let _io = null;

exports.setIo = (io) => {
  _io = io;
};

exports.getIo = () => _io;