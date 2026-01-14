import { Router } from 'express';
import * as invitationController from '../controllers/invitation.controller.js';
import { authenticate, requireCoach } from '../middleware/auth.middleware.js';

const router = Router();

// Verificar invitación (público)
router.get('/verify/:code', invitationController.verifyInvitation);

// Requieren autenticación
router.use(authenticate);

// Solo coaches
router.post('/', requireCoach, invitationController.createInvitation);
router.get('/', requireCoach, invitationController.getMyInvitations);
router.delete('/:invitationId', requireCoach, invitationController.cancelInvitation);

export default router;
