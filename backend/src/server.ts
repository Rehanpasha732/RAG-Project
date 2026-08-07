import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import express from 'express';
import cors from 'cors';
import path from 'path';
import documentRoutes from './routes/user/documentRoutes';
import authRoutes from './routes/user/authRoutes';
import conversationRoutes from './routes/user/conversationRoutes';
import settingsRoutes from './routes/user/settingsRoutes';
import adminAuthRoutes from './routes/admin/authRoutes';
import adminDashboardRoutes from './routes/admin/dashboardRoutes';
import adminDocumentRoutes from './routes/admin/documentRoutes';
import adminUserRoutes from './routes/admin/userRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (for preview)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/user/conversations', conversationRoutes);
app.use('/api/user/settings', settingsRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/documents', adminDocumentRoutes);
app.use('/api/admin/users', adminUserRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DocXtract API is running' });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 DocXtract backend running`);
});

export default app;
