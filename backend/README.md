# 🔷 Dayflow HRMS - Backend API

A production-ready **Human Resource Management System (HRMS)** API built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with role-based access control (RBAC)
- **Employee Management** - Full employee lifecycle management
- **Attendance Tracking** - Check-in/check-out, shifts, corrections
- **Leave Management** - Leave types, balances, approvals
- **Payroll** - Salary structures, monthly payroll generation
- **Reports & Analytics** - Comprehensive reporting
- **Email Notifications** - Powered by Resend
- **API Documentation** - Auto-generated Swagger docs

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (NeonDB compatible)
- **ORM**: Prisma
- **Auth**: JWT + Supabase compatible
- **Validation**: Zod
- **Email**: Resend
- **Documentation**: OpenAPI/Swagger

## 📁 Project Structure

```
src/
├── modules/
│   ├── auth/           # Authentication & authorization
│   ├── company/        # Company & organization management
│   ├── employee/       # Employee management
│   ├── attendance/     # Attendance & time tracking
│   ├── leave/          # Leave management
│   ├── payroll/        # Payroll processing
│   ├── notifications/  # Notifications & emails
│   └── reports/        # Reports & analytics
├── shared/
│   ├── middleware/     # Auth, validation, error handling
│   ├── utils/          # Helpers, logger, response utilities
│   ├── validators/     # Common Zod schemas
│   ├── constants/      # App constants
│   └── types/          # TypeScript types
├── prisma/
│   ├── schema.prisma   # Database schema
│   ├── client.ts       # Prisma client
│   └── seed.ts         # Database seeding
├── routes.ts           # Route aggregator
├── app.ts              # Express app setup
├── server.ts           # Server entry point
└── swagger.ts          # Swagger configuration
```

## 🏁 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (NeonDB or local)
- pnpm/npm/yarn

### Installation

1. **Clone and install dependencies**

```bash
cd backend
npm install
```

2. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Generate Prisma client**

```bash
npm run prisma:generate
```

4. **Run database migrations**

```bash
npm run prisma:migrate
```

5. **Seed the database (optional)**

```bash
npm run seed
```

6. **Start the development server**

```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:

- **Swagger UI**: `http://localhost:4000/api/docs`
- **OpenAPI JSON**: `http://localhost:4000/api/docs.json`

## 🔐 User Roles

| Role            | Description                               |
| --------------- | ----------------------------------------- |
| `SUPER_ADMIN`   | Platform administrator with full access   |
| `COMPANY_ADMIN` | Company HR/Admin with company-wide access |
| `MANAGER`       | Team manager with team-level access       |
| `EMPLOYEE`      | Regular employee with self-service access |

## 🔑 Sample Credentials

After running the seed script:

| Role     | Email             | Password  |
| -------- | ----------------- | --------- |
| Admin    | admin@acme.com    | Admin@123 |
| Manager  | manager@acme.com  | Admin@123 |
| Employee | employee@acme.com | Admin@123 |

## 📡 API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/signup` - Company signup
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/invite` - Invite employee
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Company

- `GET /api/v1/company` - Get company profile
- `PUT /api/v1/company` - Update company
- `CRUD /api/v1/company/departments` - Departments
- `CRUD /api/v1/company/designations` - Designations
- `CRUD /api/v1/company/locations` - Locations
- `CRUD /api/v1/company/shifts` - Shifts
- `CRUD /api/v1/company/holidays` - Holidays

### Employees

- `GET /api/v1/employees` - List employees
- `POST /api/v1/employees` - Create employee
- `GET /api/v1/employees/:id` - Get employee
- `PUT /api/v1/employees/:id` - Update employee
- `PATCH /api/v1/employees/:id/status` - Update status
- `DELETE /api/v1/employees/:id` - Delete employee
- `GET /api/v1/employees/:id/salary` - Get salary structure
- `PUT /api/v1/employees/:id/salary` - Set salary structure

### Attendance

- `POST /api/v1/attendance/check-in` - Check in
- `POST /api/v1/attendance/check-out` - Check out
- `GET /api/v1/attendance/today` - Today's status
- `GET /api/v1/attendance/my-history` - My attendance history
- `GET /api/v1/attendance` - List attendance (manager)
- `GET /api/v1/attendance/summary` - Monthly summary

### Leave

- `GET /api/v1/leave/types` - List leave types
- `GET /api/v1/leave/my/balances` - My leave balances
- `GET /api/v1/leave/my/requests` - My leave requests
- `POST /api/v1/leave/apply` - Apply for leave
- `POST /api/v1/leave/:id/cancel` - Cancel leave
- `GET /api/v1/leave/pending` - Pending requests (manager)
- `PUT /api/v1/leave/:id/action` - Approve/reject leave

### Payroll

- `POST /api/v1/payroll/generate` - Generate payroll
- `GET /api/v1/payroll` - List payroll runs
- `GET /api/v1/payroll/:id` - Get payroll details
- `POST /api/v1/payroll/:id/process` - Process payroll
- `POST /api/v1/payroll/:id/complete` - Complete payroll
- `GET /api/v1/payroll/my-payslips` - My payslips

### Reports

- `GET /api/v1/reports/dashboard` - Dashboard stats
- `GET /api/v1/reports/attendance` - Attendance report
- `GET /api/v1/reports/leave` - Leave report
- `GET /api/v1/reports/payroll` - Payroll report
- `GET /api/v1/reports/employee-lifecycle` - Lifecycle report

## 🐳 Docker

### Build and run with Docker

```bash
docker build -t dayflow-api .
docker run -p 4000:4000 --env-file .env dayflow-api
```

### Using Docker Compose

```bash
docker-compose up -d
```

## 🧪 Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix
```

## 📊 Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Push schema changes (dev)
npm run prisma:push

# Open Prisma Studio
npm run prisma:studio

# Seed database
npm run seed
```

## 🔧 Environment Variables

| Variable                 | Description                  | Default               |
| ------------------------ | ---------------------------- | --------------------- |
| `NODE_ENV`               | Environment                  | development           |
| `PORT`                   | Server port                  | 4000                  |
| `DATABASE_URL`           | PostgreSQL connection string | -                     |
| `JWT_SECRET`             | JWT signing secret           | -                     |
| `JWT_EXPIRES_IN`         | Access token expiry          | 1d                    |
| `JWT_REFRESH_SECRET`     | Refresh token secret         | -                     |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry         | 7d                    |
| `RESEND_API_KEY`         | Resend API key               | -                     |
| `EMAIL_FROM`             | Sender email                 | noreply@dayflow.io    |
| `FRONTEND_URL`           | Frontend URL                 | http://localhost:3000 |

## 📝 License

MIT License - see LICENSE file for details.
