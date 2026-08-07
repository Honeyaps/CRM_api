# 🚀 NexCRM — AI-Powered Customer Relationship Management

A full-stack CRM built with **React TypeScript** + **Node.js Express** + **MySQL**.

---

## 📁 Project Structure

```
nexcrm/
├── crm-backend/          # Node.js + Express + TypeScript + Sequelize + MySQL
│   ├── src/
│   │   ├── config/       # Database config
│   │   ├── controllers/  # Request handlers (auth, leads, tasks, AI, etc.)
│   │   ├── middleware/    # JWT auth, role guard, error handler, file upload
│   │   ├── models/       # Sequelize models (User, Lead, Task, Note, etc.)
│   │   ├── routes/       # Express routes
│   │   ├── scripts/      # DB seed script
│   │   ├── types/        # TypeScript interfaces & enums
│   │   ├── utils/        # Helper functions
│   │   └── app.ts        # Entry point
│   └── package.json
│
├── crm-frontend/         # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/   # Reusable UI (Modal, Sidebar, StatusBadge, etc.)
│   │   ├── pages/        # Dashboard, Leads, LeadDetail, Tasks, Notifications, Team
│   │   ├── services/     # Axios API layer
│   │   ├── store/        # Auth Context
│   │   ├── types/        # TypeScript interfaces
│   │   ├── utils/        # Formatters, config maps
│   │   └── styles/       # Tailwind globals
│   └── package.json
└── README.md
```

---

## 🛠️ Setup Instructions

### Step 1: MySQL Database

Open MySQL (via terminal, Workbench, or phpMyAdmin) and create the database:

```sql
CREATE DATABASE crm_db;
```

### Step 2: Backend Setup

```bash
cd crm-backend

# Install dependencies
npm install

# Create .env file (copy from example)
cp .env.example .env

# Edit .env — set your MySQL credentials:
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=crm_db
# DB_USER=root
# DB_PASS=your_mysql_password
# JWT_SECRET=any_random_secret_string

# Seed the database with demo data
npx ts-node src/scripts/seedDb.ts

# Start the dev server
npm run dev
```

Backend will run on **http://localhost:5000**

### Step 3: Frontend Setup

```bash
cd crm-frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend will run on **http://localhost:5173**

### Step 4: Login

Open http://localhost:5173 and use these demo credentials:

| Role    | Email            | Password   |
|---------|------------------|------------|
| Admin   | admin@crm.com    | admin123   |
| Manager | priya@crm.com    | manager123 |
| Sales   | honey@crm.com    | sales123   |
| Sales   | rahul@crm.com    | sales123   |

---

## ✨ Features

### Core CRM
- **Dashboard** — Stats cards, line/bar/pie charts, revenue tracking
- **Lead Management** — Full pipeline (New → Contacted → Meeting → Proposal → Won/Lost)
- **Tasks** — Create, assign, track with due dates and priorities
- **Notes** — Add notes per lead
- **Timeline** — Activity log for each customer
- **Documents** — Upload files (PDF, DOCX, XLSX, images)
- **Notifications** — Real-time bell notifications
- **Search & Filters** — By status, priority, source, keyword

### AI Features
- **AI Summary** — Auto-summarize customer requirements
- **AI Email Draft** — Generate professional reply emails
- **AI Task Suggestions** — Auto-suggest follow-up tasks
- Works with Anthropic Claude API (set `ANTHROPIC_API_KEY` in `.env`)
- Falls back to rule-based AI if no API key

### Auth & Security
- JWT Authentication
- Role-Based Access (Admin, Manager, Sales)
- Sales reps can only see their assigned leads
- Password hashing with bcrypt

---

## 🏗️ Architecture

### Backend (MVC + Service Pattern)
```
Request → Route → Controller → Service/Model → Database → Response
```

### Frontend (Component-Based)
```
App → AuthContext → Layout → Pages → Components → API Service → Backend
```

### Database Schema (7 Tables)
- `users` — Authentication & roles
- `leads` — Customer leads with pipeline status
- `tasks` — Follow-up tasks
- `notes` — Per-lead notes
- `activities` — Timeline/history log
- `documents` — File uploads
- `notifications` — Bell notifications

---

## 🚢 Deployment

### Build Frontend
```bash
cd crm-frontend
npm run build   # Output in dist/
```

### Build Backend
```bash
cd crm-backend
npm run build   # Output in dist/
npm start       # Run production build
```

### Vercel (Frontend)
1. Push `crm-frontend` to GitHub
2. Import in Vercel
3. Set `VITE_API_URL` env variable to your backend URL
4. Deploy

### Backend Hosting
- Use Railway, Render, or any VPS
- Set all `.env` variables
- Ensure MySQL is accessible

---

## 📝 API Endpoints

| Method | Endpoint                  | Description              | Auth |
|--------|---------------------------|--------------------------|------|
| POST   | /api/auth/register        | Register user            | No   |
| POST   | /api/auth/login           | Login                    | No   |
| GET    | /api/auth/profile         | Get profile              | Yes  |
| GET    | /api/dashboard/stats      | Dashboard analytics      | Yes  |
| GET    | /api/leads                | List leads (with filters)| Yes  |
| POST   | /api/leads                | Create lead              | Yes  |
| GET    | /api/leads/:id            | Get lead detail          | Yes  |
| PUT    | /api/leads/:id            | Update lead              | Yes  |
| DELETE | /api/leads/:id            | Delete lead              | Admin|
| GET    | /api/tasks                | List tasks               | Yes  |
| POST   | /api/tasks                | Create task              | Yes  |
| PUT    | /api/tasks/:id            | Update task              | Yes  |
| POST   | /api/notes                | Add note                 | Yes  |
| GET    | /api/notes/lead/:id       | Get notes for lead       | Yes  |
| GET    | /api/activities/lead/:id  | Get timeline             | Yes  |
| POST   | /api/documents/lead/:id   | Upload document          | Yes  |
| GET    | /api/notifications        | Get notifications        | Yes  |
| PUT    | /api/notifications/read-all| Mark all read           | Yes  |
| POST   | /api/ai/summary           | AI summary               | Yes  |
| POST   | /api/ai/email-draft       | AI email draft           | Yes  |
| POST   | /api/ai/task-suggestion   | AI task suggestion       | Yes  |
| GET    | /api/users                | List users (admin)       | Admin|
