<div align="center">

# 🌟 Dayflow HRMS

### Modern Human Resource Management System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

*A comprehensive, beautiful, and feature-rich HRMS solution built with the latest technologies*

[🚀 Live Demo](#demo) • [✨ Features](#-features) • [🏁 Quick Start](#-quick-start) • [📖 Documentation](#-documentation)

---

</div>

## 📸 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Dashboard+Preview" alt="Dashboard" width="100%" />
</div>

---

## ✨ Features

### 👥 **Employee Management**
- 📋 Complete employee directory with search & filters
- 👤 Detailed employee profiles with resume, private info & salary tabs
- ➕ Add new employees with auto-generated credentials
- ✏️ Edit employee information (Admin/HR only)
- 🔐 Role-based access control (Admin, HR, Employee)

### 📅 **Leave Management**
- 📝 Apply for leaves with type selection
- ✅ Approve/Reject leave requests (Admin/HR)
- 📊 Leave balance tracking per employee
- 📋 Leave allocation management
- 📎 Document attachment support

### ⏰ **Attendance Tracking**
- 📆 Daily attendance overview
- 🎯 Status indicators (Present, Absent, On Leave)
- 📊 Attendance history & reports
- 🔍 Filter by date and department

### 💰 **Salary Information** (Admin Only)
- 💵 Monthly & yearly wage management
- 📊 Salary breakdown with components
- 📈 PF, HRA, LTA, and allowance tracking
- ✏️ Inline editing capabilities

### 🔒 **Authentication & Security**
- 🔐 Secure login with Supabase Auth
- 🍪 Cookie-based session management
- 🛡️ Row Level Security (RLS) policies
- 👮 Role-based permissions

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React Framework with App Router |
| **Supabase** | Backend, Auth & Database |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Beautiful UI components |
| **Lucide Icons** | Modern icon library |
| **Resend** | Email notifications |

---

## 🏁 Quick Start

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/dayflow-hrms.git
cd dayflow-hrms
```

### 2️⃣ Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3️⃣ Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Service (Optional)
RESEND_API_KEY=your_resend_api_key
```

> 💡 Get your Supabase credentials from [supabase.com/dashboard](https://supabase.com/dashboard)

### 4️⃣ Set Up Database

Run the SQL migrations in your Supabase SQL editor:

1. `LEAVE_MANAGEMENT_MIGRATION.sql` - Leave management tables
2. `SALARY_INFO_MIGRATION.sql` - Salary information table
3. `FIX_LEAVE_RLS_POLICIES.sql` - RLS policies for leaves
4. `CREATE_LEAVE_ALLOCATIONS.sql` - Leave allocation setup

### 5️⃣ Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

---

## 🚀 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/dayflow-hrms)

### Manual Deployment

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY` (optional)
4. Deploy!

### Post-Deployment

Update your Supabase project settings:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/**`

---

## 📁 Project Structure

```
dayflow-hrms/
├── 📂 app/
│   ├── 📂 dashboard/
│   │   ├── 📂 admin/          # Admin panel
│   │   ├── 📂 attendance/     # Attendance tracking
│   │   ├── 📂 employees/      # Employee management
│   │   ├── 📂 leaves/         # Leave management
│   │   └── 📂 profile/        # User profile
│   ├── 📂 auth/               # Authentication routes
│   └── 📄 layout.tsx          # Root layout
├── 📂 components/
│   └── 📂 ui/                 # shadcn/ui components
├── 📂 lib/
│   ├── 📂 actions/            # Server actions
│   ├── 📂 context/            # React contexts
│   ├── 📂 supabase/           # Supabase client
│   └── 📂 types/              # TypeScript types
└── 📂 sql_scripts/            # Database migrations
```

---

## 👤 User Roles

| Role | Permissions |
|------|------------|
| **Admin** | Full access to all features, user management, salary info |
| **HR** | Employee management, leave approvals, attendance |
| **Employee** | View own profile, apply for leaves, view attendance |

---

## 📖 Documentation

For detailed documentation on each module:

- 📋 [Leave Management Setup](./LEAVE_APPROVAL_SETUP.md)
- 💰 [Salary Migration Guide](./SALARY_INFO_MIGRATION.sql)
- 👤 [Employee Profile Tabs](./EMPLOYEE_PROFILE_TABS.md)
- 🚀 [Quick Start Guide](./QUICK_START.md)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Built with ❤️ by Your Team

**[⬆ Back to Top](#-dayflow-hrms)**

</div>
