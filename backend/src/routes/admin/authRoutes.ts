import express from 'express';
import { adminLogin } from '../../controllers/admin/authController';

const router = express.Router();

router.post('/login', adminLogin);

export default router;
