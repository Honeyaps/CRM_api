import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { sequelize, Message } from './models';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { TokenPayload } from './types';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ── Socket.IO ──
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Track online users: userId -> socketId
const onlineUsers = new Map<string, string>();

// Socket auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as TokenPayload;
    (socket as any).user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user as TokenPayload;
  console.log(`🟢 ${user.name} connected (${socket.id})`);

  // Register user as online
  onlineUsers.set(user.id, socket.id);
  io.emit('users:online', Array.from(onlineUsers.keys()));

  // Handle sending a message
  socket.on('message:send', async (data: { receiverId: string; content: string }) => {
    try {
      const message = await Message.create({
        content: data.content,
        sender_id: user.id,
        receiver_id: data.receiverId,
      });

      const msgPayload = {
        id: message.id,
        content: message.content,
        sender_id: user.id,
        receiver_id: data.receiverId,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: { id: user.id, name: user.name, role: user.role },
      };

      // Send to sender
      socket.emit('message:received', msgPayload);

      // Send to receiver if online
      const receiverSocket = onlineUsers.get(data.receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('message:received', msgPayload);
      }
    } catch (err) {
      console.error('Message send error:', err);
      socket.emit('message:error', 'Failed to send message');
    }
  });

  // Handle typing indicator
  socket.on('typing:start', (receiverId: string) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('typing:update', { userId: user.id, isTyping: true });
    }
  });

  socket.on('typing:stop', (receiverId: string) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('typing:update', { userId: user.id, isTyping: false });
    }
  });

  // Handle message read
  socket.on('message:read', async (senderId: string) => {
    await Message.update(
      { is_read: true, read_at: new Date() },
      { where: { sender_id: senderId, receiver_id: user.id, is_read: false } }
    );
    const senderSocket = onlineUsers.get(senderId);
    if (senderSocket) {
      io.to(senderSocket).emit('message:read-confirm', { readBy: user.id });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`🔴 ${user.name} disconnected`);
    onlineUsers.delete(user.id);
    io.emit('users:online', Array.from(onlineUsers.keys()));
  });
});

// ── Middleware ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ──
app.use('/api', routes);
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', online: onlineUsers.size, timestamp: new Date().toISOString() });
});

// ── Error Handler ──
app.use(errorHandler);

// ── Start ──
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // In production, use { alter: false } to avoid accidental schema changes
    // Run migrations manually or use { alter: true } only on first deploy
    const syncOptions = process.env.NODE_ENV === 'production'
      ? { alter: process.env.DB_SYNC_ALTER === 'true' }
      : { alter: true };
    await sequelize.sync(syncOptions);
    console.log('✅ Models synced');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💬 Socket.IO ready`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

start();
export default app;
