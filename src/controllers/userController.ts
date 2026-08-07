import { Response, NextFunction } from 'express';
import { User } from '../models';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getUsers = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, message: 'Users fetched', data: users });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) throw new AppError('User not found', 404);

    res.json({ success: true, message: 'User fetched', data: user });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    const { name, email, role, phone, is_active } = req.body;
    await user.update({ name, email, role, phone, is_active });

    res.json({ success: true, message: 'User updated', data: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    await user.update({ is_active: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
};
