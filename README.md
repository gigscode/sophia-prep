# Sophia Prep

**Divinely Inspired to Reign in Knowledge**

A comprehensive exam preparation platform for JAMB and WAEC students in Nigeria.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sophia-prep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local with your Supabase credentials
   ```

4. **Set up the database**
   - Follow instructions in `docs/DATABASE_SETUP.md`
   - Run the schema: `supabase/schema.sql`
   - Seed initial data: `supabase/seed.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:7351`

---

## 🔐 Admin Configuration

### Setting Up Admin Users

Admin users have access to administrative features including user management, question management, analytics, and system configuration.

#### 1. Configure Admin Emails

Add admin email addresses to your environment configuration:

**In `.env.local` (for local development):**
```bash
# Single admin
VITE_ADMIN_EMAILS=admin@example.com

# Multiple admins (comma-separated)
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com,admin3@example.com
```

**In Vercel (for production):**
1. Go to your Vercel project settings
2. Navigate to **Settings > Environment Variables**
3. Add `VITE_ADMIN_EMAILS` with comma-separated email addresses
4. Set for appropriate environments (Production, Preview, Development)

#### 2. Email Format Requirements

- Emails are **case-insensitive** (Admin@Example.com = admin@example.com)
- Whitespace is automatically trimmed
- Use commas to separate multiple emails
- No quotes needed around email addresses

#### 3. Verify Admin Profiles

After configuring admin emails, ensure admin users have proper database profiles:

```bash
# Run the admin profile verification script
node scripts/ensure-admin-profiles.js
```

This script will:
- ✅ Check if admin users exist in the authentication system
- ✅ Verify corresponding user_profiles records exist
- ✅ Create missing profiles with admin metadata
- ✅ Report status for each admin user

#### 4. Admin Login

Admin users can log in using:
- Their configured email address (any case variation)
- Their account password

After successful login, admin features will be accessible through the admin dashboard.

### Default Admin

The default admin user is: `reubensunday1220@gmail.com`

If `VITE_ADMIN_EMAILS` is not set, this email will be used as the default admin.

### Admin Features

Admin users have access to:
- 📊 **Analytics Dashboard** - User metrics, quiz statistics, engagement data
- 👥 **User Management** - View and manage user accounts
- 📝 **Question Management** - Add, edit, and organize quiz questions
- 📚 **Subject Management** - Manage subjects and topics
- ⚙️ **System Configuration** - Platform settings and configuration

---

## 📁 Project Structure

```
sophia-prep/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API and business logic
│   ├── config/         # Configuration files
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── public/             # Static assets
├── scripts/            # Database and utility scripts
├── supabase/          # Database schema and migrations
├── docs/              # Documentation
└── .env.local         # Environment configuration (create from .env.example)
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## 📦 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Database
- `npm run db:import-questions` - Import questions from JSON files
- `npm run import:quizzes` - Import quizzes to Supabase

### Supabase
- `npm run supabase:start` - Start local Supabase instance
- `npm run supabase:stop` - Stop local Supabase instance
- `npm run supabase:status` - Check Supabase status
- `npm run supabase:reset` - Reset local database

### Testing
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

---

## 🌐 Deployment

### Vercel Deployment

1. **Connect your repository to Vercel**

2. **Configure environment variables** in Vercel project settings:
   ```
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   VITE_ADMIN_EMAILS=<comma-separated-admin-emails>
   VITE_APP_URL=<your-production-url>
   ```

3. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Preview deployments created for pull requests

### Environment Variables Reference

See `.env.example` for a complete list of required environment variables.

**Required:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Optional:**
- `VITE_ADMIN_EMAILS` - Comma-separated admin email addresses
- `VITE_APP_URL` - Application URL (for redirects)
- `VITE_APP_NAME` - Application name
- `VITE_APP_TAGLINE` - Application tagline

---

## 📚 Documentation

- **Database Setup**: `docs/DATABASE_SETUP.md`
- **Database Reference**: `docs/DATABASE_REFERENCE.md`
- **Supabase Guide**: `supabase/README.md`
- **Accessibility**: `src/docs/ACCESSIBILITY.md`

---

## 🔒 Security

### Authentication
- Powered by Supabase Auth
- Email/password authentication
- Row Level Security (RLS) policies on all tables

### Admin Access
- Admin status determined by email configuration
- Case-insensitive email matching
- Centralized admin configuration
- No hardcoded credentials

### Data Protection
- All sensitive data encrypted at rest
- HTTPS enforced in production
- Environment variables for secrets
- No credentials in source code

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 📞 Support

For questions or issues:
- Check the documentation in the `docs/` folder
- Review the database guide in `supabase/README.md`
- Contact the development team

---

## 🎯 Features

- ✅ JAMB and WAEC exam preparation
- ✅ 21 subjects with comprehensive question banks
- ✅ Multiple quiz modes (Practice, Timed, Mock Exam)
- ✅ Progress tracking and analytics
- ✅ Study materials (videos, PDFs, syllabus)
- ✅ Subscription plans with tiered access
- ✅ Admin dashboard for content management
- ✅ Progressive Web App (PWA) support
- ✅ Responsive design for mobile and desktop
- ✅ Accessibility compliant (WCAG 2.1 AA)

---

**Built with ❤️ for Nigerian students**
