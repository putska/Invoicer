// server.js

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const socketIo = require("socket.io");
const { verifyToken } = require("@clerk/clerk-sdk-node");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// A helper function to verify a Clerk token.
// You can pass options (like audience) if needed.
async function verifyClerkToken(token) {
  // Options object is optional; adjust as needed.
  const options = {};
  return await verifyToken(token, options);
}

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

  // Socket.IO middleware to authenticate each connection.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    console.log("Token provided in handshake:", token);
    if (!token) {
      console.error("No token provided in handshake");
      //return next(new Error("Authentication error: token required"));
    }
    try {
      //const verified = await verifyClerkToken(token);
      //socket.user = verified.claims;
      next();
    } catch (err) {
      console.error("Token verification failed:", err);
      return next(new Error("Authentication error: invalid token"));
    }
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
