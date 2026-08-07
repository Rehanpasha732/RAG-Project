import express from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { listUsers, toggleUserStatus } from '../../controllers/admin/userController';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', listUsers);
router.patch('/:id/status', toggleUserStatus);

export default router;
