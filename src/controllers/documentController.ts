import { Response, NextFunction } from 'express';
import { Document, User, Activity } from '../models';
import { AuthRequest } from '../types';
import { ActivityType } from '../models/Activity';
import { AppError } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs';

export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);

    const doc = await Document.create({
      filename: req.file.filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      lead_id: req.params.leadId,
      uploaded_by: req.user!.id,
    });

    await Activity.create({
      type: ActivityType.DOCUMENT_UPLOADED,
      description: `Document uploaded: ${req.file.originalname}`,
      lead_id: req.params.leadId,
      user_id: req.user!.id,
    });

    res.status(201).json({ success: true, message: 'Document uploaded', data: doc });
  } catch (err) {
    next(err);
  }
};

export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const docs = await Document.findAll({
      where: { lead_id: req.params.leadId },
      include: [{ model: User, as: 'uploader', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, message: 'Documents fetched', data: docs });
  } catch (err) {
    next(err);
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) throw new AppError('Document not found', 404);

    const filePath = path.resolve(doc.path);
    if (!fs.existsSync(filePath)) throw new AppError('File not found on server', 404);

    res.download(filePath, doc.original_name);
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) throw new AppError('Document not found', 404);

    const filePath = path.resolve(doc.path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await doc.destroy();
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};
