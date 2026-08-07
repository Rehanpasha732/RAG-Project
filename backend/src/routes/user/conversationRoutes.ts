import express from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createConversation,
  listConversations,
  getConversation,
  addMessages,
  renameConversation,
  deleteConversation
} from '../../controllers/user/conversationController';

const router = express.Router();

router.use(authenticate);

router.post('/', createConversation);
router.get('/', listConversations);
router.get('/:id', getConversation);
router.post('/:id/messages', addMessages);
router.patch('/:id', renameConversation);
router.delete('/:id', deleteConversation);

export default router;
