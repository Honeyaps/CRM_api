import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthRequest, TokenPayload, UserRole } from '../types';
import { AppError } from '../middleware/errorHandler';

const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const exists = await User.findOne({ where: { email } });
    if (exists) throw new AppError('Email already registered', 400);

    const user = await User.create({
      name,
      email,
      password,
      role: role || UserRole.SALES,
      phone,
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: user.toSafeJSON(), token },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.is_active) throw new AppError('Invalid credentials', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new AppError('Invalid credentials', 401);

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: user.toSafeJSON(), token },
    });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.user!.id);
    if (!user) throw new AppError('User not found', 404);

    res.json({
      success: true,
      message: 'Profile fetched',
      data: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.user!.id);
    if (!user) throw new AppError('User not found', 404);

    const { name, phone, avatar } = req.body;
    await user.update({ name, phone, avatar });

    res.json({
      success: true,
      message: 'Profile updated',
      data: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.user!.id);
    if (!user) throw new AppError('User not found', 404);

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (new_password.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    const isMatch = await user.comparePassword(current_password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);

    user.password = new_password;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    next(err);
  }
};
