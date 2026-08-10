import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface IMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  read_at?: Date;
}

interface MessageCreation extends Optional<IMessage, 'id' | 'is_read' | 'read_at'> {}

class Message extends Model<IMessage, MessageCreation> implements IMessage {
  declare id: string;
  declare content: string;
  declare sender_id: string;
  declare receiver_id: string;
  declare is_read: boolean;
  declare read_at: Date;
  declare readonly created_at: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    receiver_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
    tableName: 'messages',
    updatedAt: false,
    indexes: [
      { fields: ['sender_id', 'receiver_id'] },
      { fields: ['created_at'] },
      { fields: ['receiver_id', 'is_read'] },
    ],
  }
);

export default Message;
