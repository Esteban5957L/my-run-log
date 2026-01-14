import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.put('/profile', authenticate, userController.updateProfile);
router.get('/dashboard', authenticate, userController.getAthleteDashboard);
router.get('/:userId', authenticate, userController.getProfile);

export default router;
