import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validationRules } from '../middleware/validation';
import { rateLimiters } from '../middleware/rateLimit';

const router = Router();

// Public routes (no authentication required)
router.post('/register', 
  rateLimiters.register,
  ...validationRules.register,
  AuthController.register
);

router.post('/login', 
  rateLimiters.auth,
  ...validationRules.login,
  AuthController.login
);

router.post('/password/reset-request', 
  rateLimiters.passwordReset,
  AuthController.requestPasswordReset
);

router.post('/password/reset', 
  rateLimiters.passwordReset,
  AuthController.resetPassword
);

// Protected routes (authentication required)
router.get('/verify', 
  authenticate,
  AuthController.verifyToken
);

router.put('/profile', 
  authenticate,
  ...validationRules.updateProfile,
  AuthController.updateProfile
);

router.put('/password', 
  authenticate,
  rateLimiters.passwordReset,
  ...validationRules.changePassword,
  AuthController.changePassword
);

router.delete('/account', 
  authenticate,
  rateLimiters.modify,
  AuthController.deactivateAccount
);

export { router as authRoutes };