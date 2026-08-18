// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { RegisterInput, LoginInput, JwtPayload } from '../types';
import { Role } from '@prisma/client';

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerUser = async (input: RegisterInput) => {
  const { name, email, password, role } = input;

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Email already registered.');
  }

  // Hash password with salt rounds = 12
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role ?? Role.STAFF,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });

  return { user, token };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginUser = async (input: LoginInput) => {
  const { email, password } = input;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password.');
  }

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });

  // Return user without password
  const { password: _, ...safeUser } = user;

  return { user: safeUser, token };
};

// ─── Get Profile ──────────────────────────────────────────────────────────────

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) throw new Error('User not found.');
  return user;
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as string,
  } as jwt.SignOptions);
};
