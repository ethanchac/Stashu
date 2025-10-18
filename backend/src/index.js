import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

// Import routes
import channelsRoutes from './routes/channels.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import proxyRoutes from './routes/proxy.routes.js';

const app = express();

// CORS configuration
app.use(cors({
  origin: config.cors.origins,
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public proxy route (no auth required) - must come before authenticated routes
app.use('/api/proxy', proxyRoutes);

// API routes (with auth)
app.use('/api', channelsRoutes);
app.use('/api', messagesRoutes);
app.use('/api', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Stashu API server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔥 Firebase Project: ${config.firebase.projectId}`);
});

export default app;
