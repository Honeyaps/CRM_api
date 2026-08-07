import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { LeadStatus, LeadPriority, LeadSource } from '../types';

interface ILead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  requirement?: string;
  status: LeadStatus;
  priority: LeadPriority;
  source: LeadSource;
  deal_value?: number;
  assigned_to?: string;
  ai_summary?: string;
  expected_close_date?: Date;
  lost_reason?: string;
}

interface LeadCreation extends Optional<ILead, 'id' | 'email' | 'phone' | 'company' | 'requirement' | 'deal_value' | 'assigned_to' | 'ai_summary' | 'expected_close_date' | 'lost_reason'> {}

class Lead extends Model<ILead, LeadCreation> implements ILead {
  declare id: string;
  declare name: string;
  declare email: string;
  declare phone: string;
  declare company: string;
  declare requirement: string;
  declare status: LeadStatus;
  declare priority: LeadPriority;
  declare source: LeadSource;
  declare deal_value: number;
  declare assigned_to: string;
  declare ai_summary: string;
  declare expected_close_date: Date;
  declare lost_reason: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Lead.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    company: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    requirement: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(LeadStatus)),
      defaultValue: LeadStatus.NEW,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(LeadPriority)),
      defaultValue: LeadPriority.MEDIUM,
    },
    source: {
      type: DataTypes.ENUM(...Object.values(LeadSource)),
      defaultValue: LeadSource.WEBSITE,
    },
    deal_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    ai_summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expected_close_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    lost_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'leads',
    indexes: [
      { fields: ['status'] },
      { fields: ['assigned_to'] },
      { fields: ['priority'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Lead;
