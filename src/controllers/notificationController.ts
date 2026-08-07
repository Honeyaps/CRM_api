import { Response, NextFunction } from 'express';
import { Notification } from '../models';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user!.id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    res.json({ success: true, message: 'Notifications fetched', data: notifications });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) throw new AppError('Notification not found', 404);

    await notification.update({ is_read: true, read_at: new Date() });
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: req.user!.id, is_read: false } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
