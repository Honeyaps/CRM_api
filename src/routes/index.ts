import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import { upload } from '../middleware/upload';

// Controllers
import * as auth from '../controllers/authController';
import * as leads from '../controllers/leadController';
import * as tasks from '../controllers/taskController';
import * as notes from '../controllers/noteController';
import * as activities from '../controllers/activityController';
import * as docs from '../controllers/documentController';
import * as notifications from '../controllers/notificationController';
import * as ai from '../controllers/aiController';
import * as dashboard from '../controllers/dashboardController';
import * as users from '../controllers/userController';

const router = Router();

// ── Auth ──
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/profile', authenticate, auth.getProfile);
router.put('/auth/profile', authenticate, auth.updateProfile);

// ── Dashboard ──
router.get('/dashboard/stats', authenticate, dashboard.getDashboardStats);

// ── Leads ──
router.post('/leads', authenticate, leads.createLead);
router.get('/leads', authenticate, leads.getLeads);
router.get('/leads/:id', authenticate, leads.getLeadById);
router.put('/leads/:id', authenticate, leads.updateLead);
router.delete('/leads/:id', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), leads.deleteLead);

// ── Tasks ──
router.post('/tasks', authenticate, tasks.createTask);
router.get('/tasks', authenticate, tasks.getTasks);
router.put('/tasks/:id', authenticate, tasks.updateTask);
router.delete('/tasks/:id', authenticate, tasks.deleteTask);

// ── Notes ──
router.post('/notes', authenticate, notes.createNote);
router.get('/notes/lead/:leadId', authenticate, notes.getNotes);
router.delete('/notes/:id', authenticate, notes.deleteNote);

// ── Activities / Timeline ──
router.get('/activities/lead/:leadId', authenticate, activities.getActivities);

// ── Documents ──
router.post('/documents/lead/:leadId', authenticate, upload.single('file'), docs.uploadDocument);
router.get('/documents/lead/:leadId', authenticate, docs.getDocuments);
router.get('/documents/:id/download', authenticate, docs.downloadDocument);
router.delete('/documents/:id', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), docs.deleteDocument);

// ── Notifications ──
router.get('/notifications', authenticate, notifications.getNotifications);
router.put('/notifications/:id/read', authenticate, notifications.markAsRead);
router.put('/notifications/read-all', authenticate, notifications.markAllAsRead);

// ── AI ──
router.post('/ai/summary', authenticate, ai.generateSummary);
router.post('/ai/email-draft', authenticate, ai.generateEmailDraft);
router.post('/ai/task-suggestion', authenticate, ai.generateTaskSuggestion);

// ── Users (Admin) ──
router.get('/users', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), users.getUsers);
router.get('/users/:id', authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), users.getUserById);
router.put('/users/:id', authenticate, authorize(UserRole.ADMIN), users.updateUser);
router.delete('/users/:id', authenticate, authorize(UserRole.ADMIN), users.deleteUser);

export default router;
