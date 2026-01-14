import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protegidas
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, authController.changePassword);

export default router;
