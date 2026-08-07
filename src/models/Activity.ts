import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum ActivityType {
  LEAD_CREATED = 'lead_created',
  STATUS_CHANGED = 'status_changed',
  CALL_MADE = 'call_made',
  EMAIL_SENT = 'email_sent',
  MEETING_HELD = 'meeting_held',
  NOTE_ADDED = 'note_added',
  DOCUMENT_UPLOADED = 'document_uploaded',
  TASK_CREATED = 'task_created',
  PROPOSAL_SENT = 'proposal_sent',
  PAYMENT_RECEIVED = 'payment_received',
}

interface IActivity {
  id: string;
  type: ActivityType;
  description: string;
  lead_id: string;
  user_id: string;
  metadata?: string;
}

interface ActivityCreation extends Optional<IActivity, 'id' | 'metadata'> {}

class Activity extends Model<IActivity, ActivityCreation> implements IActivity {
  declare id: string;
  declare type: ActivityType;
  declare description: string;
  declare lead_id: string;
  declare user_id: string;
  declare metadata: string;
  declare readonly created_at: Date;
}

Activity.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ActivityType)),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    lead_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'activities',
    updatedAt: false,
    indexes: [
      { fields: ['lead_id'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Activity;
