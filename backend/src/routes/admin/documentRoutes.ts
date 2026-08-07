import express from 'express';
import upload from '../../middleware/upload';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  adminUploadDocument,
  adminListDocuments,
  adminGetDocument,
  adminDeleteDocument
} from '../../controllers/admin/documentController';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', adminListDocuments);
router.post('/upload', upload.single('document'), adminUploadDocument);
router.get('/:id', adminGetDocument);
router.delete('/:id', adminDeleteDocument);

export default router;
