import { Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Lead, User, Activity, Notification } from '../models';
import { AuthRequest, LeadStatus, UserRole, NotificationType } from '../types';
import { ActivityType } from '../models/Activity';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPagination } from '../utils/helpers';

export const createLead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, company, requirement, source, priority, deal_value, assigned_to, expected_close_date } = req.body;

    const lead = await Lead.create({
      name, email, phone, company, requirement,
      source, priority, deal_value, assigned_to, expected_close_date,
      status: LeadStatus.NEW,
    });

    // Create activity log
    await Activity.create({
      type: ActivityType.LEAD_CREATED,
      description: `Lead created for ${name}`,
      lead_id: lead.id,
      user_id: req.user!.id,
    });

    // Notify assigned user
    if (assigned_to) {
      await Notification.create({
        type: NotificationType.LEAD_ASSIGNED,
        title: 'New Lead Assigned',
        message: `Lead "${name}" from ${company || 'N/A'} has been assigned to you.`,
        user_id: assigned_to,
        lead_id: lead.id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead,
    });
  } catch (err) {
    next(err);
  }
};

export const getLeads = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const { status, priority, source, search, assigned_to: filterAssigned, sort_by, sort_order } = req.query;

    const where: any = {};

    // Role-based: sales only sees their leads
    if (req.user!.role === UserRole.SALES) {
      where.assigned_to = req.user!.id;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (source) where.source = source;
    if (filterAssigned) where.assigned_to = filterAssigned;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const order: any[] = [];
    if (sort_by) {
      order.push([sort_by as string, (sort_order as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
    } else {
      order.push(['created_at', 'DESC']);
    }

    const { rows, count } = await Lead.findAndCountAll({
      where,
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'avatar'] }],
      order,
      limit,
      offset,
    });

    res.json({
      success: true,
      message: 'Leads fetched',
      data: rows,
      pagination: buildPagination(page, limit, count),
    });
  } catch (err) {
    next(err);
  }
};

export const getLeadById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'avatar'] },
      ],
    });

    if (!lead) throw new AppError('Lead not found', 404);

    // Sales can only see their own leads
    if (req.user!.role === UserRole.SALES && lead.assigned_to !== req.user!.id) {
      throw new AppError('Access denied', 403);
    }

    res.json({ success: true, message: 'Lead fetched', data: lead });
  } catch (err) {
    next(err);
  }
};

export const updateLead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) throw new AppError('Lead not found', 404);

    const oldStatus = lead.status;
    await lead.update(req.body);

    // Log status change
    if (req.body.status && req.body.status !== oldStatus) {
      await Activity.create({
        type: ActivityType.STATUS_CHANGED,
        description: `Status changed from "${oldStatus}" to "${req.body.status}"`,
        lead_id: lead.id,
        user_id: req.user!.id,
      });
    }

    res.json({ success: true, message: 'Lead updated', data: lead });
  } catch (err) {
    next(err);
  }
};

export const deleteLead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) throw new AppError('Lead not found', 404);

    await lead.destroy();
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    next(err);
  }
};
