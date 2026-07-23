# LMS Frontend

A modern Learning Management System frontend built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.11 | React framework with App Router |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first CSS styling |
| Lucide React | 1.26.0 | Icon library |
| Geist Font | - | Typography |

---

## Features

### Student Features
- User authentication (Register / Login with JWT)
- Browse courses with category filters
- Enroll in courses
- Watch video sessions and view PDFs
- Track session completion and course progress
- My Learning dashboard with progress bars
- Profile management (name, avatar, password)

### Admin Features
- Admin dashboard with stats (courses, students, enrollments, sessions)
- Course management (create, edit, delete, publish/unpublish)
- Session management (add video/PDF sessions with ordering)
- Student management
- Enrollment management

---

## Project Structure

```
lms-webapp/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── courses/        # Admin course management
│   │   │   ├── dashboard/      # Admin dashboard
│   │   │   ├── enrollments/    # Enrollment management
│   │   │   ├── sessions/       # Session management
│   │   │   └── students/       # Student list
│   │   ├── courses/
│   │   │   ├── [slug]/         # Course detail page
│   │   │   └── page.tsx        # All courses page
│   │   ├── login/              # Login/Register page
│   │   ├── my-learning/        # Student enrolled courses
│   │   ├── profile/            # User profile
│   │   ├── session/
│   │   │   └── [sessionId]/    # Session viewer
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── CourseCard.tsx       # Course card component
│   │   ├── Footer.tsx          # Footer component
│   │   ├── Loading.tsx         # Loading spinner
│   │   ├── Navbar.tsx          # Navigation bar
│   │   └── ProgressBar.tsx     # Progress indicator
│   ├── lib/
│   │   ├── api.ts              # API client with fetch wrapper
│   │   └── auth-context.tsx    # Auth context provider
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## Prerequisites

- **Node.js** — v18 or higher (v20 recommended)
- **npm** — v9 or higher
- **Backend API** — The `lms-api` server must be running

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd lms/lms-webapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create `.env.local` in the `lms-webapp/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Start Development Server

```bash
npm run dev
```

Frontend runs on [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` |

> For production, update this to your deployed API URL (e.g., `http://<ec2-ip>:5000/api`).

---

## Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

The production server runs on `http://localhost:3000`.

---

## PM2 Deployment

### Step 1: Install PM2

```bash
sudo npm install -g pm2
```

### Step 2: Build the Project

```bash
cd lms-webapp
npm run build
```

This generates the production-ready `.next` build output.

### Step 3: Start with PM2

```bash
pm2 start npm --name "lms-webapp" -- start
```

### Step 4: Verify It's Running

```bash
pm2 status
```

You should see `lms-webapp` with status `online`.

### Step 5: Save Process List

```bash
pm2 save
```

This saves the current process list so it can be restored on reboot.

### Step 6: Setup Auto-Start on Reboot

```bash
pm2 startup
```

This generates a command — copy and run it as instructed. It ensures PM2 starts automatically when the server reboots.

### Useful PM2 Commands

| Command | Description |
|---------|-------------|
| `pm2 status` | View running processes |
| `pm2 logs lms-webapp` | View logs |
| `pm2 restart lms-webapp` | Restart process |
| `pm2 stop lms-webapp` | Stop process |
| `pm2 delete lms-webapp` | Delete process |
| `pm2 monit` | Monitor CPU and memory |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
