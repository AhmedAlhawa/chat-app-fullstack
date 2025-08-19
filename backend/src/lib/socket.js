import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// Change the userSocketMap to track multiple socket IDs per user
const userSocketMap = {}; // {userId: [socketId1, socketId2, ...]}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  
  if (userId) {
    // Initialize array if it doesn't exist
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = [];
    }
    // Add the socket ID to the user's array
    userSocketMap[userId].push(socket.id);
  }

  // Send the list of online users (user IDs) to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    
    if (userId && userSocketMap[userId]) {
      // Remove the specific socket ID from the user's array
      userSocketMap[userId] = userSocketMap[userId].filter(id => id !== socket.id);
      
      // If no more connections exist for this user, remove the entry entirely
      if (userSocketMap[userId].length === 0) {
        delete userSocketMap[userId];
      }
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Update getReceiverSocketId to handle multiple connections
export function getReceiverSocketId(userId) {
  return userSocketMap[userId] || [];
}
export { io, app, server };
