// socketManager.js
const { Server } = require("socket.io");

let io = null;

const initSocket = (serverInstance) => {
  io = new Server(serverInstance, {
    cors: {
      origin: "*", // Adjust in production as needed
      methods: ["GET", "POST"],
    },
  });
  return io;
};

const getSocket = () => io;

module.exports = { initSocket, getSocket };
