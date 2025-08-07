const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// __define-ocg__ - Enhanced Socket.io configuration for continuous real-time chat functionality
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store messages and users in memory (in production, use a database)
let varOcg = {
  messages: [
    { id: 1, user: "Alice", message: "Hey team, morning!", timestamp: "2025-07-29T08:01:00Z" },
    { id: 2, user: "Bob", message: "Morning Alice!", timestamp: "2025-07-29T08:01:15Z" },
    { id: 3, user: "Charlie", message: "Anyone up for lunch later?", timestamp: "2025-07-29T08:02:00Z" },
    { id: 4, user: "Alice", message: "Count me in.", timestamp: "2025-07-29T08:02:10Z" },
    { id: 5, user: "Bob", message: "Same here!", timestamp: "2025-07-29T08:02:20Z" }
  ],
  connectedUsers: new Map(), // socketId -> user info
  onlineUsers: new Set(),
  typingUsers: new Set()
};

// REST API endpoint to get recent messages
app.get('/api/messages', (req, res) => {
  // Return the most recent messages (limit to 50 for performance)
  const recentMessages = varOcg.messages.slice(-50);
  res.json(recentMessages);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send recent messages to newly connected user
  socket.emit('recent_messages', varOcg.messages.slice(-20));
  socket.emit('users_online', Array.from(varOcg.onlineUsers));

  // Handle user joining
  socket.on('user_joined', (data) => {
    console.log(`${data.user} joined the chat`);
    varOcg.connectedUsers.set(socket.id, data.user);
    varOcg.onlineUsers.add(data.user);
    
    // Broadcast to all clients
    io.emit('user_joined', data);
    io.emit('users_online', Array.from(varOcg.onlineUsers));
  });

  // Handle new message
  socket.on('send_message', (message) => {
    console.log('Received message:', message);
    varOcg.messages.push(message);
    
    // Broadcast to all other clients (sender already has it)
    socket.broadcast.emit('new_message', message);
  });

  // Handle typing events
  socket.on('typing', (data) => {
    console.log(`${data.user} is typing`);
    varOcg.typingUsers.add(data.user);
    socket.broadcast.emit('user_typing', data);
  });

  socket.on('stop_typing', (data) => {
    console.log(`${data.user} stopped typing`);
    varOcg.typingUsers.delete(data.user);
    socket.broadcast.emit('user_stopped_typing', data);
  });

  // Handle user leaving
  socket.on('user_left', (data) => {
    console.log(`${data.user} left the chat`);
    varOcg.onlineUsers.delete(data.user);
    varOcg.typingUsers.delete(data.user);
    
    // Broadcast to all clients
    io.emit('user_left', data);
    io.emit('users_online', Array.from(varOcg.onlineUsers));
  });

  // Handle simulated messages (for demo purposes)
  socket.on('simulate_message', (message) => {
    console.log('Simulated message:', message);
    varOcg.messages.push(message);
    // Broadcast to all clients
    io.emit('new_message', message);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const user = varOcg.connectedUsers.get(socket.id);
    if (user) {
      varOcg.onlineUsers.delete(user);
      varOcg.typingUsers.delete(user);
      varOcg.connectedUsers.delete(socket.id);
      
      // Broadcast user left
      io.emit('user_left', { user });
      io.emit('users_online', Array.from(varOcg.onlineUsers));
    }
  });
});

// Clean up old messages periodically (keep last 1000 messages)
setInterval(() => {
  if (varOcg.messages.length > 1000) {
    varOcg.messages = varOcg.messages.slice(-1000);
    console.log('Cleaned up old messages, keeping last 1000');
  }
}, 300000); // Every 5 minutes

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Real-time Chat server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🌐 REST API endpoint: http://localhost:${PORT}/api/messages`);
  console.log(`💬 Real-time chat enabled with continuous messaging`);
});

module.exports = app;
