import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import athleteRoutes from './routes/athlete.routes.js';
import activityRoutes from './routes/activity.routes.js';
import planRoutes from './routes/plan.routes.js';
import messageRoutes from './routes/message.routes.js';
import stravaRoutes from './routes/strava.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import goalRoutes from './routes/goal.routes.js';
import profileRoutes from './routes/profile.routes.js';
import gearRoutes from './routes/gear.routes.js';

// Socket
import { setupSocket } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

// CORS origins
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:8080',
  'http://localhost:8081',
  'https://my-run-log.vercel.app',
];

console.log('✅ Allowed CORS origins:', allowedOrigins);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/strava', stravaRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/gear', gearRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Setup Socket.io
setupSocket(io);

// Start server
async function start() {
  await connectDatabase();
  
  httpServer.listen(env.PORT, () => {
    console.log(`
🏃 RUNN.IO Server running!
━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL: http://localhost:${env.PORT}
🌍 Environment: ${env.NODE_ENV}
━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  });
}

start().catch(console.error);

export { io };
