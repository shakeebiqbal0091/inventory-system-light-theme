import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

/**
 * Get the current user's settings.
 * Creates default settings automatically if they don't exist.
 */
export const getSettings = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      settings: true,
    },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  // Create default settings if they don't exist
  let settings = user.settings;

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
      },
    });
  }

  return {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },

    preferences: {
      currency: settings.currency,
      lowStockThreshold: settings.lowStockThreshold,
      dateFormat: settings.dateFormat,
    },

    business: {
      businessName: settings.businessName,
      businessEmail: settings.businessEmail,
      businessPhone: settings.businessPhone,
      businessAddress: settings.businessAddress,
    },

    notifications: {
      lowStockAlerts: settings.lowStockAlerts,
      salesNotifications: settings.salesNotifications,
      emailNotifications: settings.emailNotifications,
    },
  };
};

/**
 * Update user's profile.
 */
export const updateProfile = async (
  userId: string,
  input: {
    name?: string;
    email?: string;
  }
) => {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();

  if (!name) {
    throw new Error('Name is required.');
  }

  if (!email) {
    throw new Error('Email is required.');
  }

  // Check whether another user already has this email
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      NOT: {
        id: userId,
      },
    },
  });

  if (existingUser) {
    throw new Error('Email is already in use.');
  }

  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
      email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

/**
 * Update inventory preferences.
 */
export const updatePreferences = async (
  userId: string,
  input: {
    currency?: string;
    lowStockThreshold?: number;
    dateFormat?: string;
  }
) => {
  if (
    input.lowStockThreshold !== undefined &&
    (!Number.isInteger(input.lowStockThreshold) ||
      input.lowStockThreshold < 0)
  ) {
    throw new Error(
      'Low stock threshold must be a non-negative whole number.'
    );
  }

  if (input.currency !== undefined && !input.currency.trim()) {
    throw new Error('Currency cannot be empty.');
  }

  if (input.dateFormat !== undefined && !input.dateFormat.trim()) {
    throw new Error('Date format cannot be empty.');
  }

  const settings = await prisma.userSettings.upsert({
    where: {
      userId,
    },

    create: {
      userId,
      currency: input.currency?.trim().toUpperCase() ?? 'USD',
      lowStockThreshold: input.lowStockThreshold ?? 10,
      dateFormat: input.dateFormat?.trim() ?? 'MM/DD/YYYY',
    },

    update: {
      ...(input.currency !== undefined && {
        currency: input.currency.trim().toUpperCase(),
      }),

      ...(input.lowStockThreshold !== undefined && {
        lowStockThreshold: input.lowStockThreshold,
      }),

      ...(input.dateFormat !== undefined && {
        dateFormat: input.dateFormat.trim(),
      }),
    },
  });

  return {
    currency: settings.currency,
    lowStockThreshold: settings.lowStockThreshold,
    dateFormat: settings.dateFormat,
  };
};

/**
 * Update business information.
 */
export const updateBusiness = async (
  userId: string,
  input: {
    businessName?: string | null;
    businessEmail?: string | null;
    businessPhone?: string | null;
    businessAddress?: string | null;
  }
) => {
  const settings = await prisma.userSettings.upsert({
    where: {
      userId,
    },

    create: {
      userId,

      businessName:
        input.businessName?.trim() || null,

      businessEmail:
        input.businessEmail?.trim().toLowerCase() || null,

      businessPhone:
        input.businessPhone?.trim() || null,

      businessAddress:
        input.businessAddress?.trim() || null,
    },

    update: {
      ...(input.businessName !== undefined && {
        businessName:
          input.businessName?.trim() || null,
      }),

      ...(input.businessEmail !== undefined && {
        businessEmail:
          input.businessEmail?.trim().toLowerCase() || null,
      }),

      ...(input.businessPhone !== undefined && {
        businessPhone:
          input.businessPhone?.trim() || null,
      }),

      ...(input.businessAddress !== undefined && {
        businessAddress:
          input.businessAddress?.trim() || null,
      }),
    },
  });

  return {
    businessName: settings.businessName,
    businessEmail: settings.businessEmail,
    businessPhone: settings.businessPhone,
    businessAddress: settings.businessAddress,
  };
};

/**
 * Update notification preferences.
 */
export const updateNotifications = async (
  userId: string,
  input: {
    lowStockAlerts?: boolean;
    salesNotifications?: boolean;
    emailNotifications?: boolean;
  }
) => {
  const settings = await prisma.userSettings.upsert({
    where: {
      userId,
    },

    create: {
      userId,

      lowStockAlerts:
        input.lowStockAlerts ?? true,

      salesNotifications:
        input.salesNotifications ?? true,

      emailNotifications:
        input.emailNotifications ?? false,
    },

    update: {
      ...(input.lowStockAlerts !== undefined && {
        lowStockAlerts: input.lowStockAlerts,
      }),

      ...(input.salesNotifications !== undefined && {
        salesNotifications:
          input.salesNotifications,
      }),

      ...(input.emailNotifications !== undefined && {
        emailNotifications:
          input.emailNotifications,
      }),
    },
  });

  return {
    lowStockAlerts: settings.lowStockAlerts,
    salesNotifications: settings.salesNotifications,
    emailNotifications: settings.emailNotifications,
  };
};

/**
 * Change user's password.
 */
export const changePassword = async (
  userId: string,
  input: {
    currentPassword: string;
    newPassword: string;
  }
) => {
  const { currentPassword, newPassword } = input;

  if (!currentPassword || !newPassword) {
    throw new Error(
      'Current password and new password are required.'
    );
  }

  if (newPassword.length < 6) {
    throw new Error(
      'New password must be at least 6 characters.'
    );
  }

  if (currentPassword === newPassword) {
    throw new Error(
      'New password must be different from your current password.'
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!passwordMatches) {
    throw new Error('Current password is incorrect.');
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    12
  );

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    success: true,
  };
};