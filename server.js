// server.js

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const socketIo = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = socketIo(server, {
    cors: {
      origin: "*", // Adjust this in production to your domain
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Handle incoming messages
    socket.on("edit", (data) => {
      // Broadcast the edit to all other clients except the sender
      socket.broadcast.emit("edit", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  const PORT = process.env.NODE_ENV === "production" ? 3000 : 4000;

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Server listening on http://localhost:${PORT}`);
  });
});

// // Global error handling
// process.on("uncaughtException", (err) => {
//   console.error("Uncaught Exception:", err);
// });

// process.on("unhandledRejection", (reason, promise) => {
//   console.error("Unhandled Rejection at:", promise, "reason:", reason);
// });

// const { createServer } = require("http");
// const { parse } = require("url");
// const next = require("next");

// // Import the initSocket function from your socketManager file
// const { initSocket } = require("./app/components/socketManager");

// const dev = process.env.NODE_ENV !== "production";
// const app = next({ dev });
// const handle = app.getRequestHandler();

// app.prepare().then(() => {
//   const server = createServer((req, res) => {
//     const parsedUrl = parse(req.url, true);
//     handle(req, res, parsedUrl);
//   });

//   // Initialize the Socket.IO instance using our socketManager module
//   const io = initSocket(server);

//   io.on("connection", (socket) => {
//     console.log("A user connected:", socket.id);

//     // Listen for incoming "edit" events from clients
//     socket.on("edit", (data) => {
//       // Broadcast the edit event to all other connected clients except the sender
//       socket.broadcast.emit("edit", data);
//     });

//     socket.on("disconnect", () => {
//       console.log("User disconnected:", socket.id);
//     });
//   });

//   const PORT = process.env.NODE_ENV === "production" ? 3000 : 4000;

//   server.listen(PORT, (err) => {
//     if (err) throw err;
//     console.log(`> Server listening on http://localhost:${PORT}`);
//   });
// });
