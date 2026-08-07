import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { NotificationType } from '../types';

interface INotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  user_id: string;
  lead_id?: string;
  is_read: boolean;
  read_at?: Date;
}

interface NotificationCreation extends Optional<INotification, 'id' | 'lead_id' | 'is_read' | 'read_at'> {}

class Notification extends Model<INotification, NotificationCreation> implements INotification {
  declare id: string;
  declare type: NotificationType;
  declare title: string;
  declare message: string;
  declare user_id: string;
  declare lead_id: string;
  declare is_read: boolean;
  declare read_at: Date;
  declare readonly created_at: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(NotificationType)),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    lead_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_read'] },
    ],
  }
);

export default Notification;
