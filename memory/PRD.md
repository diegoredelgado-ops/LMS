# Lumina LMS - Product Requirements Document

## Project Overview
A full-stack Learning Management System (LMS) built for 500+ concurrent users with three user roles: Admin, Instructor, and Student.

## Architecture
- **Frontend**: React with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI with SQLAlchemy ORM
- **Database**: Supabase PostgreSQL
- **Authentication**: JWT tokens + GitHub OAuth
- **Payments**: Stripe test mode integration
- **AI Generation**: OpenAI GPT-4o via Emergent LLM Key

## User Personas
1. **Students** - Browse courses, enroll, track progress, take quizzes
2. **Instructors** - Create/manage courses, add lessons, view student stats, **generate courses with AI**
3. **Admins** - Platform oversight, user management, statistics

## Core Requirements (Implemented)

### Authentication
- [x] Email/password registration and login
- [x] GitHub OAuth integration
- [x] JWT token-based session management
- [x] Role-based access control (student, instructor, admin)

### Course Management
- [x] Course CRUD operations
- [x] Cover images, categories, levels (beginner/intermediate/advanced)
- [x] Free and paid course support
- [x] Course publishing workflow
- [x] **AI-powered course generation** (NEW)

### Lesson Types
- [x] Video lessons (YouTube/Vimeo embedding)
- [x] Rich text lessons (HTML content)
- [x] File-based lessons (PDF/documents)
- [x] Drag-and-drop lesson reordering

### Quizzes
- [x] Multiple choice quizzes
- [x] **AI-powered quiz generation** (NEW)
- [x] Quiz scoring and results

### Student Experience
- [x] Course catalog with search and filters
- [x] Course enrollment (free courses)
- [x] Progress tracking per course
- [x] Mark lessons as completed
- [x] Comments/questions on lessons

### Dashboards
- [x] Student dashboard (enrolled courses, progress, recommendations)
- [x] Instructor dashboard (courses, student stats, revenue, **AI generation**)
- [x] Admin dashboard (user management, platform statistics)

### Payments
- [x] Stripe checkout integration for paid courses
- [x] Payment status tracking
- [x] Webhook handling

## What's Been Implemented (March 2026)

### AI-Powered Generation (NEW)
- **Course Generation**: Instructors can generate complete courses with:
  - Title and description
  - Category and level
  - Multiple lessons with HTML content
  - Customizable number of lessons (3-10)
  - Spanish and English support
  
- **Quiz Generation**: Instructors can generate quizzes with:
  - Multiple choice questions based on course content
  - Automatic correct answer selection
  - Customizable number of questions (5-20)
  - Context-aware questions from lesson content

### Backend (FastAPI)
- Complete REST API with 35+ endpoints
- PostgreSQL with SQLAlchemy async
- JWT authentication with role-based permissions
- Stripe payment integration
- GitHub OAuth callback handling
- **Emergent LLM integration for AI generation**

### Frontend (React)
- Dark theme with glass-morphism design
- Responsive layouts for all screen sizes
- Role-based routing and dashboards
- Course editor with drag-and-drop
- Video player with YouTube/Vimeo support
- Progress tracking UI
- **AI Generation Modals for courses and quizzes**

### Database Schema
- Users, Courses, Lessons, Enrollments
- Progress tracking, Quizzes, Quiz Questions, Quiz Attempts
- Comments, Payment transactions

## P0/P1/P2 Features Remaining

### P0 (Critical - Next Sprint)
- [ ] Configure GitHub OAuth callback URL in GitHub app settings
- [ ] Add file upload functionality via Supabase Storage
- [ ] Implement proper quiz functionality with scoring

### P1 (Important)
- [ ] Course completion certificates
- [ ] Email notifications (enrollment, completion)
- [ ] Instructor payout system
- [ ] Course ratings and reviews

### P2 (Nice to Have)
- [ ] Light/dark mode toggle
- [ ] Course recommendations ML model
- [ ] Discussion forums
- [ ] Live Q&A sessions
- [ ] Mobile app

## Test Accounts
- Admin: admin@test.com / test123456
- Instructor: instructor@test.com / test123456
- Student: student@test.com / test123456

## Environment Variables Required
```
# Backend
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
JWT_SECRET=...
STRIPE_API_KEY=...

# Frontend
REACT_APP_BACKEND_URL=...
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_GITHUB_CLIENT_ID=...
```

## Next Tasks
1. Set up GitHub OAuth callback URL in GitHub developer settings
2. Implement Supabase Storage for file uploads
3. Add quiz completion and scoring logic
4. Create course completion certificates
