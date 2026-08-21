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

// ── Temporary Seed Route (REMOVE after seeding) ──
app.get('/api/seed', async (_req, res) => {
  try {
    const { User, Lead, Task, Note, Activity, Notification, Message } = require('./models');
    const { UserRole, LeadStatus, LeadPriority, LeadSource } = require('./types');

    // Clear existing data (order matters for foreign keys)
    await Message.destroy({ where: {} });
    await Notification.destroy({ where: {} });
    await Activity.destroy({ where: {} });
    await Note.destroy({ where: {} });
    await Task.destroy({ where: {} });
    await Lead.destroy({ where: {} });
    await User.destroy({ where: {} });
    console.log('🗑️ Old data cleared');

    const admin = await User.create({ name: 'Admin User', email: 'admin@crm.com', password: 'admin123', role: UserRole.ADMIN, phone: '+91-9876543210' });
    const manager = await User.create({ name: 'Priya Sharma', email: 'priya@crm.com', password: 'manager123', role: UserRole.MANAGER, phone: '+91-9876543211' });
    const sales1 = await User.create({ name: 'Honey Kumar', email: 'honey@crm.com', password: 'sales123', role: UserRole.SALES, phone: '+91-9876543212' });
    const sales2 = await User.create({ name: 'Rahul Verma', email: 'rahul@crm.com', password: 'sales123', role: UserRole.SALES, phone: '+91-9876543213' });

    await Lead.bulkCreate([
      { name: 'John Smith', email: 'john@acme.com', phone: '+91-8001234567', company: 'Acme Pvt Ltd', requirement: 'Cloud IVR with Call Recording for 80 employees', status: LeadStatus.NEW, priority: LeadPriority.HIGH, source: LeadSource.WEBSITE, deal_value: 150000, assigned_to: sales1.id },
      { name: 'Anita Desai', email: 'anita@globaltech.com', phone: '+91-8009876543', company: 'Global Tech Solutions', requirement: 'Bulk SMS and voice broadcasting for 500+ customers', status: LeadStatus.CONTACTED, priority: LeadPriority.URGENT, source: LeadSource.EMAIL, deal_value: 300000, assigned_to: sales1.id },
      { name: 'Vikram Singh', email: 'vikram@startupx.io', phone: '+91-7001234567', company: 'StartupX', requirement: 'Affordable IVR for small team of 15', status: LeadStatus.MEETING_SCHEDULED, priority: LeadPriority.MEDIUM, source: LeadSource.WHATSAPP, deal_value: 50000, assigned_to: sales2.id },
      { name: 'Meera Patel', email: 'meera@bigcorp.com', phone: '+91-6001234567', company: 'BigCorp Industries', requirement: 'Enterprise IVR with CRM integration', status: LeadStatus.PROPOSAL_SENT, priority: LeadPriority.HIGH, source: LeadSource.PHONE, deal_value: 500000, assigned_to: sales1.id },
      { name: 'Arjun Reddy', email: 'arjun@nexgen.co', phone: '+91-5001234567', company: 'NexGen Services', requirement: 'OBD service for campaign - 2 lakh calls/day', status: LeadStatus.WON, priority: LeadPriority.URGENT, source: LeadSource.REFERRAL, deal_value: 800000, assigned_to: sales2.id },
    ]);

    res.json({ message: '✅ Seed complete — 4 users, 5 leads created' });
  } catch (error: any) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
