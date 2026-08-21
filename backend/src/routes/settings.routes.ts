import { Router } from 'express';

import * as SettingsController
  from '../controllers/settings.controller';

import { authenticate } from '../middleware/auth';

const router = Router();

/*
 * All settings routes require authentication.
 */
router.use(authenticate);

/*
 * Get all settings
 *
 * GET /api/settings
 */
router.get(
  '/',
  SettingsController.getSettings
);

/*
 * Profile
 *
 * PUT /api/settings/profile
 */
router.put(
  '/profile',
  SettingsController.updateProfile
);

/*
 * Inventory preferences
 *
 * PUT /api/settings/preferences
 */
router.put(
  '/preferences',
  SettingsController.updatePreferences
);

/*
 * Business information
 *
 * PUT /api/settings/business
 */
router.put(
  '/business',
  SettingsController.updateBusiness
);

/*
 * Notification preferences
 *
 * PUT /api/settings/notifications
 */
router.put(
  '/notifications',
  SettingsController.updateNotifications
);

/*
 * Password
 *
 * PUT /api/settings/password
 */
router.put(
  '/password',
  SettingsController.changePassword
);

export default router;