import { Router } from 'express';
import * as stravaController from '../controllers/strava.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// OAuth
router.get('/auth', authenticate, stravaController.initiateAuth);
router.get('/callback', stravaController.handleCallback);

// Acciones autenticadas
router.post('/sync', authenticate, stravaController.syncActivities);
router.post('/sync-all', authenticate, stravaController.syncAllAthletes); // Para coaches
router.delete('/disconnect', authenticate, stravaController.disconnect);
router.get('/status', authenticate, stravaController.getStatus);

// Webhook (público para Strava)
router.get('/webhook', stravaController.webhookVerify);
router.post('/webhook', stravaController.webhookReceive);

export default router;
