import express from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { changePassword, updateProfile } from '../../controllers/user/settingsController';

const router = express.Router();

router.use(authenticate);

router.patch('/password', changePassword);
router.patch('/profile', updateProfile);

export default router;
