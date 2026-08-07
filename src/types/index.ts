import { Request } from 'express';

// ── User & Auth ──
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  is_active: boolean;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

// ── Lead ──
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  MEETING_SCHEDULED = 'meeting_scheduled',
  PROPOSAL_SENT = 'proposal_sent',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
}

export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum LeadSource {
  WEBSITE = 'website',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  PHONE = 'phone',
  REFERRAL = 'referral',
  OTHER = 'other',
}

// ── Task ──
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// ── Notification ──
export enum NotificationType {
  LEAD_ASSIGNED = 'lead_assigned',
  TASK_DUE = 'task_due',
  MEETING_REMINDER = 'meeting_reminder',
  PAYMENT_RECEIVED = 'payment_received',
  FOLLOW_UP = 'follow_up',
  GENERAL = 'general',
}

// ── API Response ──
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
