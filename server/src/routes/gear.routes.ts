import { Router } from 'express';
import * as gearController from '../controllers/gear.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// CRUD de equipamiento
router.get('/', gearController.getGear);
router.get('/alerts', gearController.getGearAlerts);
router.get('/:gearId', gearController.getGearById);
router.post('/', gearController.createGear);
router.put('/:gearId', gearController.updateGear);
router.delete('/:gearId', gearController.deleteGear);

// Asignar/remover gear de actividades
router.post('/activity/:activityId', gearController.assignGearToActivity);
router.delete('/activity/:activityId/:gearId', gearController.removeGearFromActivity);

export default router;
