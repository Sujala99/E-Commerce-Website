const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const http = require("http");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const { Server } = require("socket.io");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/auth");

const app = express();
const port = 8080;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(helmet()); // Add security headers
app.use(bodyParser.json());

// CORS Headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Static files (images)
app.use("/images", express.static(path.join(__dirname, "images")));

// Route mounting
app.use("/auth", authRoutes);

// Global error handler
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";
  const data = error.data || null;
  res.status(statusCode).json({ message, data });
});

// Socket.IO example
let messages = ["test"];
io.on("connection", (socket) => {
  socket.on("chat-message", (message) => {
    messages.push(message);
    io.emit("messages", messages);
  });
});

// Connect to MongoDB and start server
const databaseUrl = process.env.MONGODB_URL || "mongodb+srv://sujala-rai:admin123@mongodb-cluster.3zpdtzg.mongodb.net/?retryWrites=true&w=majority&appName=Luna-DB";

mongoose
  .connect(databaseUrl)
  .then(() => {
    server.listen(port, () => {
      console.log(`✅ Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
  });
