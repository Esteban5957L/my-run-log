import { Router } from 'express';
import * as activityController from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', activityController.getActivities);
router.get('/:activityId', activityController.getActivity);
router.post('/', activityController.createActivity);
router.put('/:activityId', activityController.updateActivity);
router.delete('/:activityId', activityController.deleteActivity);
router.post('/:activityId/feedback', activityController.addCoachFeedback);

export default router;
