import { Router } from 'express';
import * as goalController from '../controllers/goal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', goalController.getGoals);
router.get('/stats/historical', goalController.getHistoricalStats);
router.post('/', goalController.createGoal);
router.put('/:goalId', goalController.updateGoal);
router.delete('/:goalId', goalController.deleteGoal);

export default router;
