import { Router } from 'express';
import * as planController from '../controllers/plan.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Calendario
router.get('/calendar', planController.getCalendarSessions);

// Plantillas
router.get('/templates', planController.getTemplates);
router.post('/templates/:templateId/create-plan', planController.createPlanFromTemplate);

// Planes
router.get('/', planController.getPlans);
router.get('/:planId', planController.getPlan);
router.post('/', planController.createPlan);
router.put('/:planId', planController.updatePlan);
router.delete('/:planId', planController.deletePlan);

// Duplicar y crear plantilla
router.post('/:planId/duplicate', planController.duplicatePlan);
router.post('/:planId/create-template', planController.createTemplate);

// Sesiones
router.post('/:planId/sessions', planController.addSession);
router.patch('/sessions/:sessionId', planController.updateSessionStatus);
router.patch('/sessions/:sessionId/feedback', planController.addSessionFeedback);

export default router;
