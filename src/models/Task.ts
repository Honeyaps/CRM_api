import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { TaskStatus, TaskPriority } from '../types';

interface ITask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: Date;
  due_time?: string;
  lead_id?: string;
  assigned_to?: string;
  created_by: string;
  completed_at?: Date;
}

interface TaskCreation extends Optional<ITask, 'id' | 'description' | 'due_date' | 'due_time' | 'lead_id' | 'assigned_to' | 'completed_at'> {}

class Task extends Model<ITask, TaskCreation> implements ITask {
  declare id: string;
  declare title: string;
  declare description: string;
  declare status: TaskStatus;
  declare priority: TaskPriority;
  declare due_date: Date;
  declare due_time: string;
  declare lead_id: string;
  declare assigned_to: string;
  declare created_by: string;
  declare completed_at: Date;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TaskStatus)),
      defaultValue: TaskStatus.PENDING,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(TaskPriority)),
      defaultValue: TaskPriority.MEDIUM,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    due_time: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    lead_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    indexes: [
      { fields: ['status'] },
      { fields: ['assigned_to'] },
      { fields: ['due_date'] },
      { fields: ['lead_id'] },
    ],
  }
);

export default Task;
