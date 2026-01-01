# Student Management System SaaS

A comprehensive student management system built with Next.js 14, TypeScript, and Supabase. This application provides a complete solution for managing students, classes, fee payments, and communications in educational institutions.

## Features

- **Student Management**: Complete CRUD operations for student profiles with detailed information
- **Class Management**: Create and manage classes with enrollment tracking
- **Payment Tracking**: Monitor fee payments with automatic status updates
- **Communications**: Send emails and SMS to students (Resend & Twilio integration)
- **Dashboard**: Real-time statistics and insights
- **Authentication**: Secure login system with role-based access control
- **Responsive Design**: Mobile-first approach with monochrome black & white theme
- **Row Level Security**: Database-level security with Supabase RLS policies

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions)
- **Language**: TypeScript
- **Database & Auth**: Supabase (PostgreSQL, GoTrue Auth, Row Level Security)
- **Styling**: Tailwind CSS with Shadcn/UI (Monochrome theme)
- **Communication**: Resend (Email), Twilio (SMS)
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.x or higher
- npm or yarn package manager
- A Supabase account
- A Resend account (for email functionality)
- A Twilio account (for SMS functionality)

## Setup Instructions

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd student-management-system-saas
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set Up Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy the contents of \`supabase-schema.sql\` and execute it in the SQL Editor
4. This will create all necessary tables, views, functions, triggers, and RLS policies

### 4. Set Up External Services

#### Resend (Email)
1. Sign up at [Resend](https://resend.com)
2. Create an API key
3. Verify your domain (or use their test domain for development)

#### Twilio (SMS)
1. Sign up at [Twilio](https://www.twilio.com)
2. Get your Account SID and Auth Token
3. Purchase a phone number for sending SMS

### 5. Configure Environment Variables

Copy \`.env.example\` to \`.env.local\`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in your actual values in \`.env.local\`:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Cron Jobs Security
CRON_SECRET=your_random_secret_key_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 6. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Create Your First User

1. Navigate to \`/signup\`
2. Create an account (first user will be admin by default)
3. Check your email for verification (if email confirmation is enabled)
4. Login and start using the system

## Database Schema Overview

### Core Tables

- **profiles**: User profiles extending auth.users with role information
- **students**: Complete student information including guardian details
- **classes**: Class/batch information with fee and capacity tracking
- **enrollments**: Many-to-many relationship between students and classes
- **fee_payments**: Payment records with status tracking
- **payment_transactions**: Ledger for all payment transactions
- **communications**: Email/SMS communication logs
- **activity_logs**: Audit trail for system activities

### Key Features

- **Automatic timestamp updates**: All tables have triggers for \`updated_at\`
- **Payment automation**: Utility functions for generating monthly fees and marking overdue payments
- **Summary views**: Pre-computed views for student payment summaries and class enrollment stats
- **Row Level Security**: All tables have RLS policies based on user roles

## Folder Structure

\`\`\`
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   ├── (dashboard)/         # Dashboard pages
│   │   ├── students/        # Student management
│   │   ├── classes/         # Class management
│   │   ├── payments/        # Payment tracking
│   │   ├── communications/  # Email/SMS
│   │   └── settings/        # System settings
│   ├── api/
│   │   └── cron/           # Cron job endpoints
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Shadcn UI components
│   ├── layout/             # Layout components
│   └── [feature]/          # Feature-specific components
├── lib/
│   ├── actions/            # Server actions
│   ├── supabase/           # Supabase clients
│   ├── services/           # External services
│   └── utils/              # Utility functions
├── types/                  # TypeScript type definitions
├── supabase-schema.sql     # Database schema
└── README.md
\`\`\`

## Development Commands

\`\`\`bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
\`\`\`

## Deployment

### Recommended: Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Ensure all environment variables from \`.env.example\` are set in your deployment platform.

### Cron Jobs Setup

For automated tasks (generating fees, marking overdue payments), set up cron jobs:

**Generate Monthly Fees** (Run on 1st of every month):
\`\`\`bash
curl -X POST https://your-domain.com/api/cron/generate-fees \\
  -H "Authorization: Bearer YOUR_CRON_SECRET" \\
  -H "Content-Type: application/json"
\`\`\`

**Mark Overdue Payments** (Run daily):
\`\`\`bash
curl -X POST https://your-domain.com/api/cron/mark-overdue \\
  -H "Authorization: Bearer YOUR_CRON_SECRET"
\`\`\`

You can use services like:
- Vercel Cron Jobs
- GitHub Actions
- External cron services (cron-job.org, EasyCron, etc.)

## Security Considerations

- All database operations use Row Level Security (RLS)
- API endpoints are protected with CRON_SECRET
- User authentication handled by Supabase Auth
- Input validation using Zod schemas
- Service role key only used server-side when necessary

## Monochrome Design

This application strictly uses a black & white monochrome color scheme:
- Black (#000) for primary elements
- White (#fff) for backgrounds
- Grayscale shades for variations
- No colored elements (blue, green, red, yellow, etc.)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review Supabase and Next.js documentation

## Roadmap

- [ ] Advanced reporting and analytics
- [ ] Bulk operations for students and payments
- [ ] Attendance tracking
- [ ] Grade management
- [ ] Parent portal
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced role-based permissions
- [ ] Export functionality (PDF, Excel)
- [ ] Integration with payment gateways

## Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Shadcn for the beautiful UI components
- Vercel for hosting platform

---

Built with ❤️ using Next.js 14, TypeScript, and Supabase
