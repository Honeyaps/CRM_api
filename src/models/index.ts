import sequelize from '../config/database';
import User from './User';
import Lead from './Lead';
import Task from './Task';
import Note from './Note';
import Activity from './Activity';
import Document from './Document';
import Notification from './Notification';

// ── Associations ──

// Lead belongs to User (assigned sales person)
Lead.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
User.hasMany(Lead, { foreignKey: 'assigned_to', as: 'leads' });

// Tasks
Task.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Lead.hasMany(Task, { foreignKey: 'lead_id', as: 'tasks' });

// Notes
Note.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Note.belongsTo(User, { foreignKey: 'created_by', as: 'author' });
Lead.hasMany(Note, { foreignKey: 'lead_id', as: 'notes' });

// Activities (Timeline)
Activity.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Lead.hasMany(Activity, { foreignKey: 'lead_id', as: 'activities' });

// Documents
Document.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Document.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
Lead.hasMany(Document, { foreignKey: 'lead_id', as: 'documents' });

// Notifications
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

export { sequelize, User, Lead, Task, Note, Activity, Document, Notification };
