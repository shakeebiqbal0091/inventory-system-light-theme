import { Request, Response } from 'express';
import * as SettingsService from '../services/settings.service';

/**
 * GET /api/settings
 */
export const getSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const settings =
      await SettingsService.getSettings(userId);

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * PUT /api/settings/profile
 */
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const { name, email } = req.body;

    const user =
      await SettingsService.updateProfile(
        userId,
        {
          name,
          email,
        }
      );

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * PUT /api/settings/preferences
 */
export const updatePreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const {
      currency,
      lowStockThreshold,
      dateFormat,
    } = req.body;

    const preferences =
      await SettingsService.updatePreferences(
        userId,
        {
          currency,
          lowStockThreshold,
          dateFormat,
        }
      );

    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Inventory preferences updated successfully.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * PUT /api/settings/business
 */
export const updateBusiness = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const {
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
    } = req.body;

    const business =
      await SettingsService.updateBusiness(
        userId,
        {
          businessName,
          businessEmail,
          businessPhone,
          businessAddress,
        }
      );

    res.status(200).json({
      success: true,
      data: business,
      message: 'Business information updated successfully.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * PUT /api/settings/notifications
 */
export const updateNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const {
      lowStockAlerts,
      salesNotifications,
      emailNotifications,
    } = req.body;

    const notifications =
      await SettingsService.updateNotifications(
        userId,
        {
          lowStockAlerts,
          salesNotifications,
          emailNotifications,
        }
      );

    res.status(200).json({
      success: true,
      data: notifications,
      message: 'Notification settings updated successfully.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * PUT /api/settings/password
 */
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const {
      currentPassword,
      newPassword,
    } = req.body;

    await SettingsService.changePassword(
      userId,
      {
        currentPassword,
        newPassword,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};