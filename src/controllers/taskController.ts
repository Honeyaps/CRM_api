import { Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Task, User, Lead } from '../models';
import { AuthRequest, TaskStatus, UserRole } from '../types';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPagination } from '../utils/helpers';

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, priority, due_date, due_time, lead_id, assigned_to } = req.body;

    const task = await Task.create({
      title, description, priority, due_date, due_time, lead_id,
      assigned_to: assigned_to || req.user!.id,
      created_by: req.user!.id,
      status: TaskStatus.PENDING,
    });

    res.status(201).json({ success: true, message: 'Task created', data: task });
  } catch (err) {
    next(err);
  }
};

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const { status, priority, lead_id } = req.query;

    const where: any = {};
    if (req.user!.role === UserRole.SALES) {
      where.assigned_to = req.user!.id;
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (lead_id) where.lead_id = lead_id;

    const { rows, count } = await Task.findAndCountAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: Lead, as: 'lead', attributes: ['id', 'name', 'company'] },
      ],
      order: [['due_date', 'ASC'], ['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({ success: true, message: 'Tasks fetched', data: rows, pagination: buildPagination(page, limit, count) });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) throw new AppError('Task not found', 404);

    if (req.body.status === TaskStatus.COMPLETED) {
      req.body.completed_at = new Date();
    }

    await task.update(req.body);
    res.json({ success: true, message: 'Task updated', data: task });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) throw new AppError('Task not found', 404);
    await task.destroy();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};
