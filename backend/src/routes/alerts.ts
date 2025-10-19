import { Router } from 'express';
import { AlertController } from '../controllers/AlertController';
import { authenticate } from '../middleware/auth';
import { validationRules } from '../middleware/validation';
import { rateLimiters } from '../middleware/rateLimit';

const router = Router();

// All alert routes require authentication

router.post('/', 
  authenticate,
  rateLimiters.alerts,
  AlertController.createAlert
);

router.get('/', 
  authenticate,
  rateLimiters.alerts,
  AlertController.getUserAlerts
);

router.get('/summary', 
  authenticate,
  rateLimiters.alerts,
  AlertController.getAlertSummary
);

router.get('/notifications', 
  authenticate,
  rateLimiters.alerts,
  AlertController.getAlertNotifications
);

router.get('/preferences', 
  authenticate,
  rateLimiters.alerts,
  AlertController.getNotificationPreferences
);

router.put('/preferences', 
  authenticate,
  rateLimiters.alerts,
  AlertController.updateNotificationPreferences
);

router.get('/:id', 
  authenticate,
  rateLimiters.alerts,
  AlertController.getAlertById
);

router.put('/:id', 
  authenticate,
  rateLimiters.alerts,
  AlertController.updateAlert
);

router.delete('/:id', 
  authenticate,
  rateLimiters.modify,
  AlertController.deleteAlert
);

router.put('/notifications/:id/read', 
  authenticate,
  rateLimiters.alerts,
  AlertController.markNotificationRead
);

export { router as alertRoutes };