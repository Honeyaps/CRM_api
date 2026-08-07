import { Response, NextFunction } from 'express';
import { Activity, User } from '../models';
import { AuthRequest } from '../types';

export const getActivities = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activities = await Activity.findAll({
      where: { lead_id: req.params.leadId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, message: 'Activities fetched', data: activities });
  } catch (err) {
    next(err);
  }
};
