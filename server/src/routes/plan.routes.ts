import { Router } from 'express';
import * as planController from '../controllers/plan.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', planController.getPlans);
router.get('/:planId', planController.getPlan);
router.post('/', planController.createPlan);
router.put('/:planId', planController.updatePlan);
router.delete('/:planId', planController.deletePlan);

// Sesiones
router.post('/:planId/sessions', planController.addSession);
router.patch('/sessions/:sessionId', planController.updateSessionStatus);

export default router;
