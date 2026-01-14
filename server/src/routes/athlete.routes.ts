import { Router } from 'express';
import * as athleteController from '../controllers/athlete.controller.js';
import { authenticate, requireCoach } from '../middleware/auth.middleware.js';

const router = Router();

// Todas requieren autenticación
router.use(authenticate);

// Obtener mis atletas (solo coaches)
router.get('/', requireCoach, athleteController.getMyAthletes);

// Obtener detalle de un atleta
router.get('/:athleteId', athleteController.getAthleteDetail);

// Desvincular atleta (solo coaches)
router.delete('/:athleteId', requireCoach, athleteController.removeAthlete);

export default router;
