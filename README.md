# LMS Web App (Frontend)

This project is the **website** of a Learning Management System (LMS).

Think of an LMS like a small online school:

- **Students** create an account, browse courses, enroll, watch lessons, and track progress.
- **Admins** add courses, add video/PDF lessons, and manage students and enrollments.

This repository is **only the frontend** (what you see in the browser). It does **not** store courses or users by itself. It talks to a **backend API** that should already be running on **port 5000**.

---

## What this app does (in simple words)

| Who | What they can do |
|-----|------------------|
| Visitor | Open the home page, browse courses |
| Student | Register / login, enroll, watch sessions, see progress, edit profile |
| Admin | See dashboard numbers, manage courses, sessions, students, enrollments |

When you click Login, the website sends your email and password to the backend. The backend replies with a **token** (like a temporary pass). The website saves that token in the browser and sends it with later requests so the API knows who you are.

---

## How the project is split

```
Your browser  →  this Next.js website (port 3000)
                      ↓
                 backend API (port 5000)  →  database
```

- **This repo (`lms-webapp`)** = screens, buttons, and pages.
- **Backend (`lms-api`, separate project)** = login, courses, enrollments, progress.

If the backend is not running, pages may load but courses/login will fail.

The API address is set with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

`NEXT_PUBLIC_` means the value is available in the browser. That is important later when you run Docker: the **browser** must be able to reach port 5000, not only the frontend container.

---

## Tech used (short)

| Tool | Why it is here |
|------|----------------|
| **Next.js 16** | Builds the website and its pages |
| **React 19** | UI (buttons, lists, forms) |
| **TypeScript** | Catches many mistakes before the app runs |
| **Tailwind CSS 4** | Styling with small utility classes |
| **Lucide** | Icons |

You do **not** need to know all of these to run the app. You need Node.js for local runs, or Docker if you follow the Docker lessons.

---

## Folders you should know

```
lms-webapp/
├── src/app/            Pages (home, login, courses, admin, ...)
├── src/components/     Reusable pieces (navbar, course card, footer)
├── src/lib/api.ts      All calls to the backend
├── src/lib/auth-context.tsx   Login state (who is logged in)
├── src/types/          TypeScript shapes for User, Course, Session, ...
├── public/             Images and static files
├── Dockerfile          Recipe to put this app in a container
├── .dockerignore       Files Docker should not copy into the image
└── package.json        App name, scripts, and npm packages
```

Useful pages:

- `/` — home
- `/login` — login / register
- `/courses` — all courses
- `/courses/[slug]` — one course
- `/my-learning` — courses you enrolled in
- `/session/[sessionId]` — watch a lesson
- `/profile` — your account
- `/admin/...` — admin tools (only if your user role is `admin`)

---

## Run it on your computer (without Docker)

### What you need

- Node.js 20 (18+ can work)
- npm
- Backend API running at `http://localhost:5000`

### Steps

1. Open a terminal in this folder.

2. Install packages:

```bash
npm install
```

3. Create a file named `.env.local` in this folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the website:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

### Other commands

| Command | What it does |
|---------|----------------|
| `npm run dev` | Development server (auto-refresh while you edit) |
| `npm run build` | Create a production build |
| `npm run start` | Run that production build |
| `npm run lint` | Check code style / common mistakes |

---

## Run it with Docker

The `Dockerfile` in this folder is a step-by-step recipe: install packages, build the Next.js app, then start it on port **3000**.

Student guides (read in this order):

1. [dockerignore-guide.md](./dockerignore-guide.md) — what Docker should **not** copy
2. [dockerfile-demo.md](./dockerfile-demo.md) — how to write a Dockerfile, **line by line**, then build and run, and how to talk to a backend container on port 5000
3. [multi-stage-build.md](./multi-stage-build.md) — what a multi-stage Dockerfile is, and a smaller production image for this app

Quick start (details are in `dockerfile-demo.md`):

```bash
docker build -t lms-webapp .
docker run -d --name lms-web -p 3000:3000 lms-webapp
```

Then open [http://localhost:3000](http://localhost:3000).

The backend should be reachable from **your browser** at `http://localhost:5000` (usually by publishing the backend container port: `-p 5000:5000`).

---

## Environment variables

| Name | Meaning | Typical local value |
|------|---------|---------------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` |

Because the name starts with `NEXT_PUBLIC_`, Next.js puts this value into the frontend JavaScript **at build time**. If you change it, rebuild the app (or rebuild the Docker image).

---

## How data flows (one example)

1. You open `/courses`.
2. The page calls `api.courses.getAll()` in `src/lib/api.ts`.
3. The browser sends a request to `http://localhost:5000/api/courses`.
4. The backend returns a JSON list of courses.
5. React shows them with `CourseCard`.

Login works the same way, but the response includes a JWT token stored in `localStorage`.

---

## If something does not work

- **Blank courses / login error** — is the backend running on port 5000?
- **CORS error in the browser console** — the backend must allow origin `http://localhost:3000`.
- **Docker site loads but API fails** — you opened the site in a browser. The browser must use `localhost:5000`, not a Docker-only name like `lms-api`. See [dockerfile-demo.md](./dockerfile-demo.md).
