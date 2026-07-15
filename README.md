# Orbit — Multi-Country Business Monitoring Platform

A role-based business intelligence platform for companies operating across
multiple countries — monitoring sales, exports, and attendance with scoped
dashboards, granular RBAC, hybrid SQL+MongoDB storage, an AI data assistant,
and full CI/CD deployment.

## Live Demo
- **App:** (add Firebase URL after deployment)
- **API:** (add Render URL after deployment)

> Note: Backend on Render free tier — first load may take 30–60s to wake up.

### Demo Logins (password: `Password123!`)
| Role | Email |
|---|---|
| Super Admin | superadmin@orbit.test |
| India Admin | india.admin@orbit.test |
| Germany Admin | germany.admin@orbit.test |
| Mumbai Manager | mumbai.manager@orbit.test |
| Mumbai Intern | mumbai.intern@orbit.test |

## Tech Stack
- **Backend:** NestJS · TypeScript · Prisma · PostgreSQL (Neon) · Mongoose · MongoDB (Atlas)
- **Frontend:** React · Vite · TypeScript · Tailwind CSS · Recharts
- **Auth:** JWT + Role-Based Access Control with per-user permission overrides
- **AI:** Anthropic Claude with tool-calling into scoped business APIs
- **CI/CD:** GitHub Actions → Firebase Hosting (frontend) + Render (backend)

## Key Features
- Multi-country business monitoring (Sales, Export, Attendance)
- 6-tier RBAC with individual permission overrides per user
- Data automatically scoped per role — no client-side filtering tricks
- AI assistant queries real data within user's access scope
- Audit trail auto-logged to MongoDB on every write action
- PR preview deployments via Firebase Hosting channels

## Architecture