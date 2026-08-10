import { Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Message, User } from '../models';
import { AuthRequest } from '../types';

// Helper: ensure date is ISO string
const toISO = (val: any): string => {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  if (typeof val.toISOString === 'function') return val.toISOString();
  return new Date().toISOString();
};

export const getChatHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const myId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: myId, receiver_id: userId },
          { sender_id: userId, receiver_id: myId },
        ],
      },
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar', 'role'] },
      ],
    });

    await Message.update(
      { is_read: true, read_at: new Date() },
      { where: { sender_id: userId, receiver_id: myId, is_read: false } }
    );

    // Format messages with proper ISO dates
    const formatted = messages.reverse().map(m => {
      const json = m.toJSON() as any;
      return {
        ...json,
        created_at: toISO(json.created_at || json.createdAt),
      };
    });

    res.json({ success: true, message: 'Chat history fetched', data: formatted });
  } catch (err) {
    next(err);
  }
};

export const getChatContacts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const myId = req.user!.id;

    const users = await User.findAll({
      where: { id: { [Op.ne]: myId }, is_active: true },
      attributes: ['id', 'name', 'email', 'role', 'avatar'],
      order: [['name', 'ASC']],
    });

    const contacts = await Promise.all(
      users.map(async (u) => {
        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { sender_id: myId, receiver_id: u.id },
              { sender_id: u.id, receiver_id: myId },
            ],
          },
          order: [['created_at', 'DESC']],
        });

        const unreadCount = await Message.count({
          where: { sender_id: u.id, receiver_id: myId, is_read: false },
        });

        let lastMsg = null;
        if (lastMessage) {
          const json = lastMessage.toJSON() as any;
          lastMsg = {
            content: json.content,
            created_at: toISO(json.created_at || json.createdAt),
            is_mine: json.sender_id === myId,
          };
        }

        return {
          user: u.toJSON(),
          lastMessage: lastMsg,
          unreadCount,
        };
      })
    );

    contacts.sort((a, b) => {
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      }
      return 0;
    });

    res.json({ success: true, message: 'Contacts fetched', data: contacts });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const count = await Message.count({
      where: { receiver_id: req.user!.id, is_read: false },
    });
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};

export const deleteMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messageIds } = req.body;
    const myId = req.user!.id;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      res.status(400).json({ success: false, message: 'No message IDs provided' });
      return;
    }

    await Message.destroy({
      where: {
        id: { [Op.in]: messageIds },
        [Op.or]: [
          { sender_id: myId },
          { receiver_id: myId },
        ],
      },
    });

    res.json({ success: true, message: `${messageIds.length} message(s) deleted` });
  } catch (err) {
    next(err);
  }
};