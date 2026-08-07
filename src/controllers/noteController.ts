import { Response, NextFunction } from 'express';
import { Note, User, Activity } from '../models';
import { AuthRequest } from '../types';
import { ActivityType } from '../models/Activity';
import { AppError } from '../middleware/errorHandler';

export const createNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, lead_id } = req.body;

    const note = await Note.create({
      content,
      lead_id,
      created_by: req.user!.id,
    });

    await Activity.create({
      type: ActivityType.NOTE_ADDED,
      description: `Note added: "${content.substring(0, 80)}..."`,
      lead_id,
      user_id: req.user!.id,
    });

    const full = await Note.findByPk(note.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }],
    });

    res.status(201).json({ success: true, message: 'Note added', data: full });
  } catch (err) {
    next(err);
  }
};

export const getNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notes = await Note.findAll({
      where: { lead_id: req.params.leadId },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, message: 'Notes fetched', data: notes });
  } catch (err) {
    next(err);
  }
};

export const deleteNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) throw new AppError('Note not found', 404);
    await note.destroy();
    res.json({ success: true, message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
};
