import { Response, NextFunction } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Lead, Task, Notification, User } from '../models';
import { AuthRequest, LeadStatus, TaskStatus, UserRole } from '../types';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isSales = req.user!.role === UserRole.SALES;
    const userFilter = isSales ? { assigned_to: req.user!.id } : {};
    const taskFilter = isSales ? { assigned_to: req.user!.id } : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalLeads, todayLeads, wonDeals, lostDeals, pendingTasks, revenue, statusBreakdown, sourceBreakdown, monthlyLeads] = await Promise.all([
      Lead.count({ where: userFilter }),
      Lead.count({ where: { ...userFilter, created_at: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
      Lead.count({ where: { ...userFilter, status: LeadStatus.WON } }),
      Lead.count({ where: { ...userFilter, status: LeadStatus.LOST } }),
      Task.count({ where: { ...taskFilter, status: TaskStatus.PENDING } }),
      Lead.sum('deal_value', { where: { ...userFilter, status: LeadStatus.WON } }),
      Lead.findAll({
        where: userFilter,
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Lead.findAll({
        where: userFilter,
        attributes: ['source', [fn('COUNT', col('id')), 'count']],
        group: ['source'],
        raw: true,
      }),
      Lead.findAll({
        where: {
          ...userFilter,
          created_at: { [Op.gte]: literal("DATE_SUB(CURDATE(), INTERVAL 6 MONTH)") },
        },
        attributes: [
          [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
          [fn('COUNT', col('id')), 'count'],
        ],
        group: [fn('DATE_FORMAT', col('created_at'), '%Y-%m')],
        order: [[fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'ASC']],
        raw: true,
      }),
    ]);

    const unreadNotifications = await Notification.count({
      where: { user_id: req.user!.id, is_read: false },
    });

    res.json({
      success: true,
      message: 'Dashboard stats fetched',
      data: {
        overview: {
          totalLeads,
          todayLeads,
          wonDeals,
          lostDeals,
          pendingTasks,
          revenue: revenue || 0,
          conversionRate: totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(1) : '0',
          unreadNotifications,
        },
        charts: {
          statusBreakdown,
          sourceBreakdown,
          monthlyLeads,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
