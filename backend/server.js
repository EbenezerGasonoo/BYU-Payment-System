require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const { startCardExpiryJob } = require('./utils/cronJobs');
const ChatMessage = require('./models/ChatMessage');

// Import routes
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Start cron jobs
startCardExpiryJob();

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'BYU Pathway Ghana Virtual Card Payment Platform API',
    version: '2.0.0',
    endpoints: {
      student: {
        register: 'POST /api/student/register',
        requestCard: 'POST /api/student/request-card',
        dashboard: 'GET /api/student/dashboard/:byuId',
        getRequest: 'GET /api/student/request/:requestToken'
      },
      admin: {
        requests: 'GET /api/admin/requests',
        assign: 'POST /api/admin/assign',
        assignMock: 'POST /api/admin/assign/mock',
        action: 'POST /api/admin/action',
        stats: 'GET /api/admin/stats',
        messages: 'GET /api/contact/messages'
      },
      contact: {
        submit: 'POST /api/contact/submit',
        messages: 'GET /api/contact/messages (admin)',
        update: 'PATCH /api/contact/messages/:id (admin)'
      }
    }
  });
});

app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Socket.io for live chat
const activeSessions = new Map(); // sessionId -> socket.id
const adminSockets = new Set();

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // User joins chat
  socket.on('join-chat', async ({ sessionId, userName, isAdmin }) => {
    socket.join(sessionId);
    
    if (isAdmin) {
      adminSockets.add(socket.id);
      console.log('👨‍💼 Admin joined chat');
    } else {
      activeSessions.set(sessionId, socket.id);
      console.log(`💬 User ${userName} joined session: ${sessionId}`);
      
      // Notify admins
      adminSockets.forEach(adminSocket => {
        io.to(adminSocket).emit('new-chat-session', { sessionId, userName });
      });
    }

    // Load previous messages
    const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 }).limit(50);
    socket.emit('previous-messages', messages);
  });

  // Send message
  socket.on('send-message', async (data) => {
    try {
      const { sessionId, sender, senderName, message } = data;

      // Save to database
      const chatMessage = new ChatMessage({
        sessionId,
        sender,
        senderName,
        message
      });
      await chatMessage.save();

      // Broadcast to everyone in the session
      io.to(sessionId).emit('new-message', chatMessage);

      // Notify admins if message is from user
      if (sender === 'user') {
        adminSockets.forEach(adminSocket => {
          io.to(adminSocket).emit('new-user-message', {
            sessionId,
            senderName,
            message: chatMessage
          });
        });
      }

      console.log(`💬 Message from ${senderName}: ${message.substring(0, 50)}...`);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message-error', 'Failed to send message');
    }
  });

  // Admin requests all active chats
  socket.on('get-active-chats', () => {
    const sessions = Array.from(activeSessions.keys());
    socket.emit('active-chats', sessions);
  });

  // Typing indicator
  socket.on('typing', ({ sessionId, userName, isTyping }) => {
    socket.to(sessionId).emit('user-typing', { userName, isTyping });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
    
    // Remove from admin sockets
    adminSockets.delete(socket.id);
    
    // Remove from active sessions
    for (const [sessionId, socketId] of activeSessions.entries()) {
      if (socketId === socket.id) {
        activeSessions.delete(sessionId);
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log(`💬 Live Chat: Enabled`);
  console.log(`📧 Email notifications: ${process.env.EMAIL_USER ? 'Enabled' : 'Disabled'}`);
  console.log(`🔐 Admin key: ${process.env.ADMIN_KEY ? 'Set' : 'Not set'}\n`);
});

