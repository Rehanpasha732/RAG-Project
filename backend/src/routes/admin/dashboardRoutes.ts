import express from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { getStats } from '../../controllers/admin/dashboardController';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getStats);

export default router;
