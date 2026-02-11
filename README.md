# EduFlow - Student Management System SaaS

EduFlow is a modern, all-in-one SaaS platform designed for educational institutes to manage their day-to-day operations efficiently. From student enrollment to fee management and attendance tracking, EduFlow provides a unified dashboard to streamline "ed-admin" tasks.

![EduFlow Dashboard](https://placehold.co/1200x600/png?text=EduFlow+Dashboard+Preview)

## 🚀 Key Features

*   **Dashboard & Analytics**: Real-time overview of revenue, active students, and attendance trends.
*   **Student Management**: Comprehensive profiles, enrollment tracking, and academic records.
*   **Session Scheduling**: manage class schedules, sessions, and teacher assignments.
*   **Attendance Tracking**: Digital attendance sheets with automated reporting.
*   **Fee Management**: Record payments, track dues, and generate financial reports.
*   **Tutorials & Resources**: Upload and manage learning materials for students.
*   **Communications**: integrated messaging system (Email/SMS) for announcements [NEW].
*   **Role-Based Access**: Secure access for Admins, Teachers, and Students.

## 🛠 Tech Stack

*   **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
*   **UI Framework**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Framer Motion](https://www.framer.com/motion/)
*   **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
*   **Icons**: [Lucide React](https://lucide.dev/)

## ⚡️ Getting Started

### Prerequisites

*   Node.js 18+
*   npm or yarn
*   A Supabase project

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/eduflow.git
    cd eduflow
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    ```

4.  **Database Setup**
    Run the SQL scripts provided in `full_database_schema.sql` in your Supabase SQL Editor to set up the tables and policies.

5.  **Run the development server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Authentication routes (login, signup)
│   ├── (dashboard)/      # Protected dashboard routes
│   └── page.tsx          # Landing page
├── components/           # Reusable UI components
│   ├── ui/               # Shadcn UI primitives
│   └── ...               # Feature-specific components
├── lib/                  # Utilities and server actions
│   ├── actions/          # Server Actions (Backend logic)
│   └── supabase/         # Supabase client configuration
└── types/                # TypeScript type definitions
```

## 🔒 Security

*   **Row Level Security (RLS)**: Data access is strictly controlled at the database level using Supabase RLS policies.
*   **Middleware Protection**: Protected routes are guarded by Next.js middleware ensuring only authenticated access.

## 📄 License

This project is licensed under the MIT License.
