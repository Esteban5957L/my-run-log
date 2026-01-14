import { Router } from 'express';
import * as messageController from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/conversations', messageController.getConversations);
router.get('/unread/count', messageController.getUnreadCount);
router.get('/:userId', messageController.getMessages);
router.post('/', messageController.sendMessage);
router.post('/:senderId/read', messageController.markAsRead);

export default router;
