# LMS Web App (Frontend)

This repository is the **website** of a Learning Management System (LMS): a small online school in the browser.

- **Students** register or log in, browse courses, open lessons (video / PDF), and track progress.
- **Admins** manage courses, sessions, students, and enrollments from `/admin`.

This repo is **only the frontend**. It does not store users, courses, or progress. Every real action (login, course list, enroll, mark complete) is an HTTP call to a **separate backend API**, usually on **port 5000**.

If the API is down, the pages still load, but login and data will fail.

**Repo:** [https://github.com/AIdeas-Tech-Solutions-Private-Limited/lms-webapp](https://github.com/AIdeas-Tech-Solutions-Private-Limited/lms-webapp)

---

## How the application works

```
Your browser
   │
   │  http://SERVER:3000     ← this Next.js website (HTML, CSS, JS)
   │
   └──► http://SERVER:5000/api   ← backend (auth, courses, enrollments, DB)
```

The important detail: **the browser** calls the API, not “the Next.js server talking privately to the API.”

`src/lib/api.ts` sends `fetch` requests to:

```text
NEXT_PUBLIC_API_URL   (default: http://localhost:5000/api)
```

Login returns a **JWT**. The site stores it in `localStorage` and sends:

```http
Authorization: Bearer <token>
```

on later requests. `src/lib/auth-context.tsx` keeps “who is logged in” and whether `user.role === "admin"`.

Because the variable starts with `NEXT_PUBLIC_`, Next.js **bakes the API URL into the JavaScript at `npm run build`**. If you change the URL, you must **rebuild**. Setting it only after the build (or only in PM2) will not update the running site.

---

## What you can do in the app

| Role | What they can do |
|------|------------------|
| Visitor | Home page, browse courses, open a course page |
| Student | Register / login, My Learning, watch sessions, mark complete, edit profile |
| Admin | Dashboard counts, CRUD courses and sessions, list students, enroll a student by email |

Students do **not** self-enroll from the course page. An admin assigns a course on **Enrollments**. Until then, My Learning is empty.

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Home: categories + featured courses |
| `/login` | Login / register |
| `/courses` | All courses (optional category filter) |
| `/courses/[slug]` | Course detail + session list |
| `/my-learning` | Enrolled courses + progress (logged-in students) |
| `/session/[sessionId]` | Video / PDF viewer + mark complete |
| `/profile` | Name, avatar, password |
| `/admin/dashboard` | Counts: courses, students, enrollments, sessions |
| `/admin/courses` | Create / edit / delete / publish courses |
| `/admin/sessions` | Video or PDF lessons, order |
| `/admin/students` | Student list |
| `/admin/enrollments` | Enroll by email + course |

Admin routes send non-admins back to `/`.

### API used by this frontend

All paths are under `NEXT_PUBLIC_API_URL` (example: `http://<host>:5000/api`).

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Categories | `GET /categories` (admin can also create/update/delete) |
| Courses | `GET /courses`, `GET /courses/slug/:slug`, admin CRUD + `/courses/admin/all` |
| Sessions | `GET /sessions/course/:id`, `GET /sessions/:id`, admin CRUD |
| Enrollments | `GET /enrollments/my`, `GET /enrollments`, `POST /enrollments` |
| Progress | `POST /progress/:sessionId/complete`, `GET /progress/:sessionId`, `GET /progress/course/:courseId` |
| Profile | `GET /profile`, `PUT /profile`, `PUT /profile/change-password` |
| Admin | `GET /admin/dashboard`, `GET /admin/students` |

### Tech stack

| Tool | Role |
|------|------|
| Next.js 16 (App Router) | Pages and production server (`next start` on port **3000**) |
| React 19 | UI |
| TypeScript | Types for User, Course, Session, Enrollment |
| Tailwind CSS 4 | Styling |
| Lucide | Icons |

### Folders

```
lms-webapp/
├── src/app/                 Pages (routes above)
├── src/components/          Navbar, Footer, CourseCard, ProgressBar, Loading
├── src/lib/api.ts           All backend HTTP calls
├── src/lib/auth-context.tsx Login state + JWT in localStorage
├── src/types/               TypeScript interfaces
├── public/                  Static files
├── package.json             Scripts: dev, build, start, lint
├── Dockerfile               Container build (optional)
└── .dockerignore            Files not copied into a Docker image
```

---

## Run locally (development)

**Need:** Node.js 20, npm, and the backend listening on `http://localhost:5000`.

```bash
git clone https://github.com/AIdeas-Tech-Solutions-Private-Limited/lms-webapp.git
cd lms-webapp
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | What it does |
|---------|----------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (writes `.next/`) |
| `npm run start` | Serve that build on port 3000 |
| `npm run lint` | ESLint |

Local CORS: the API must allow origin `http://localhost:3000`.

---

## Deploy on AWS EC2 with PM2 (end to end)

This section goes from an empty Ubuntu EC2 to a public site on port 3000, talking to an API on port 5000, with CORS set correctly.

Replace every `YOUR_EC2_PUBLIC_IP` with the instance public IPv4 (example: `13.232.45.10`).

### What you are deploying

| Process | Typical port | How it stays up |
|---------|--------------|-----------------|
| This frontend (`next start`) | 3000 | PM2 process `lms-webapp` |
| Backend API (`lms-api` or similar) | 5000 | PM2 (or whatever you already use) |
| Database | often 5432 / 3306 | Only on localhost, not public |

The visitor’s browser must reach **both** `http://YOUR_EC2_PUBLIC_IP:3000` and `http://YOUR_EC2_PUBLIC_IP:5000`. Using `localhost` in `NEXT_PUBLIC_API_URL` on the server is wrong: the visitor’s browser would call **their own computer**, not EC2.

```
Visitor browser
   ├─► http://YOUR_EC2_PUBLIC_IP:3000     frontend
   └─► http://YOUR_EC2_PUBLIC_IP:5000/api backend
```

### Prerequisites

- AWS account
- SSH key pair (`.pem`)
- Backend repo ready (or already running on the same instance)
- This GitHub repo access (public clone, or a PAT / deploy key if private)

---

### Step 1 — Launch the EC2 instance

1. AWS Console → **EC2** → **Launch instance**.
2. Name: `lms-server` (any name).
3. AMI: **Ubuntu Server 22.04 or 24.04 LTS**.
4. Instance type: **t2.small** or **t3.small** (t2.micro can run out of RAM during `next build`; 2 GB is safer).
5. Key pair: create or select one. Download the `.pem` and keep it private.
6. Storage: 20 GB gp3 is enough.
7. Launch the instance. Wait until **running**. Copy **Public IPv4 address**.

### Step 2 — Security group (ports)

Edit the instance security group **inbound** rules:

| Type | Port | Source | Why |
|------|------|--------|-----|
| SSH | 22 | My IP | Log in |
| Custom TCP | 3000 | 0.0.0.0/0 | Website |
| Custom TCP | 5000 | 0.0.0.0/0 | API (browser calls this) |

Do **not** open the database port to `0.0.0.0/0`.

If Ubuntu firewall is on:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
sudo ufw status
```

### Step 3 — SSH into the server

On your laptop (Windows PowerShell, macOS, or Linux). Put the real key path and IP:

```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Windows: if the key is refused, run:

```powershell
icacls.exe $env:USERPROFILE\.ssh\your-key.pem /inheritance:r
icacls.exe $env:USERPROFILE\.ssh\your-key.pem /grant:r "$($env:USERNAME):(R)"
```

First login: `yes` to the host fingerprint. You should see an `ubuntu@...` prompt.

### Step 4 — Install Node.js 20, git, and PM2

On the **server**:

```bash
sudo apt update
sudo apt install -y git curl build-essential

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v    # should show v20.x
npm -v

sudo npm install -g pm2
pm2 -v
```

PM2 keeps Node processes running, restarts them if they crash, and can start them again after reboot.

### Step 5 — Clone this frontend

```bash
cd ~
git clone https://github.com/AIdeas-Tech-Solutions-Private-Limited/lms-webapp.git
cd lms-webapp
```

If the default branch is not the one you want:

```bash
git checkout dev
```

If the repo is **private**, GitHub will reject a plain clone. Use a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) in the HTTPS URL, or add an SSH deploy key and clone with `git@github.com:...`.

### Step 6 — Install npm packages

```bash
cd ~/lms-webapp
npm ci
```

`npm ci` matches `package-lock.json` exactly. If it fails, use `npm install`.

### Step 7 — Point the frontend at the backend URL

Create the env file **before** building. On the server:

```bash
cd ~/lms-webapp
nano .env.local
```

Put **one** line (use your real public IP, keep `/api` at the end):

```env
NEXT_PUBLIC_API_URL=http://YOUR_EC2_PUBLIC_IP:5000/api
```

Example:

```env
NEXT_PUBLIC_API_URL=http://13.232.45.10:5000/api
```

Save: `Ctrl+O`, Enter, `Ctrl+X`.

| Situation | Value to use |
|-----------|----------------|
| API on the **same** EC2, visitors use the public IP | `http://YOUR_EC2_PUBLIC_IP:5000/api` |
| API on another host | `http://OTHER_HOST:5000/api` (that host must be reachable from the visitor’s browser) |
| Laptop only | `http://localhost:5000/api` |

**Do not** use `http://localhost:5000/api` on EC2 for a public demo. **Do not** use a Docker-only name like `http://lms-api:5000/api` here: the browser cannot resolve it.

Confirm the file:

```bash
cat ~/lms-webapp/.env.local
```

### Step 8 — CORS on the backend

The website origin is:

```text
http://YOUR_EC2_PUBLIC_IP:3000
```

The API is on another origin (different port). The browser will block requests unless the API sends CORS headers that allow that origin.

On the **backend** project, allow at least:

- `http://localhost:3000` (local work)
- `http://YOUR_EC2_PUBLIC_IP:3000` (this EC2 site)

Typical Express setup:

```js
const cors = require("cors");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://YOUR_EC2_PUBLIC_IP:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

If the API uses an env variable (names differ by repo):

```env
CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP:3000
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP:3000
```

Restart the API after changing CORS (PM2: `pm2 restart lms-api` or whatever name you used).

If CORS is wrong you will see in DevTools → Console:

```text
Access-Control-Allow-Origin
blocked by CORS policy
```

The frontend PM2 process cannot fix that. Change and restart the **API**.

### Step 9 — Run (or confirm) the backend on port 5000

The API must be listening on `0.0.0.0:5000` (all interfaces), not only `127.0.0.1`, so the internet can reach it.

Quick check **on the server**:

```bash
curl -sS http://127.0.0.1:5000/api/courses
curl -sS http://YOUR_EC2_PUBLIC_IP:5000/api/courses
```

From your **laptop** browser or terminal:

```text
http://YOUR_EC2_PUBLIC_IP:5000/api/courses
```

You want JSON (or a known API message), not a timeout. If this fails, fix the API, security group, and bind address **before** building the frontend.

### Step 10 — Build the Next.js production app

Still on the server, inside the frontend folder:

```bash
cd ~/lms-webapp
npm run build
```

Wait until it finishes without errors. This creates `.next/` and **embeds** `NEXT_PUBLIC_API_URL`.

If you typed the IP wrong, fix `.env.local` and run `npm run build` again. Then restart PM2 (step 12).

### Step 11 — Start the frontend with PM2

```bash
cd ~/lms-webapp
pm2 start npm --name "lms-webapp" -- start
```

That runs `npm run start` → `next start` on port **3000**.

```bash
pm2 status
pm2 logs lms-webapp --lines 50
```

`lms-webapp` should be **online**. Logs should look like a Next.js server on port 3000, not a crash loop.

If port 3000 is busy:

```bash
sudo ss -tlnp | grep 3000
```

Stop the other process or use another port (`PORT=3001 pm2 start ...`) and open that port in the security group.

### Step 12 — Survive reboot

```bash
pm2 save
pm2 startup
```

`pm2 startup` prints a `sudo env PATH=...` command. **Copy and run that exact command.** Then:

```bash
pm2 save
```

After reboot, `pm2 status` should still show `lms-webapp` online.

Useful PM2 commands:

| Command | Meaning |
|---------|---------|
| `pm2 status` | List processes |
| `pm2 logs lms-webapp` | Logs |
| `pm2 restart lms-webapp` | Restart after a new build |
| `pm2 stop lms-webapp` | Stop |
| `pm2 delete lms-webapp` | Remove from PM2 |
| `pm2 monit` | CPU / memory |

### Step 13 — After every frontend code or API-URL change

```bash
cd ~/lms-webapp
git pull
npm ci
# edit .env.local if the API URL changed
npm run build
pm2 restart lms-webapp
```

---

## Verify the deployment (end to end)

Do these in order. Do not skip the API check.

### 1. PM2 on the server

```bash
pm2 status
curl -I http://127.0.0.1:3000
```

Expect `lms-webapp` **online** and HTTP **200** (or 307) from curl.

### 2. Website from your laptop

Open:

```text
http://YOUR_EC2_PUBLIC_IP:3000
```

You should see the LMS home page (navbar, hero, courses area). If this times out, fix security group / ufw / `pm2 logs`.

### 3. API from your laptop

Open:

```text
http://YOUR_EC2_PUBLIC_IP:5000/api/courses
```

JSON should appear. If this fails, the site will load but stay empty or login will fail.

### 4. Backend URL baked into the frontend

On your laptop, DevTools (F12) → **Network**. Reload `http://YOUR_EC2_PUBLIC_IP:3000`. Course requests must go to:

```text
http://YOUR_EC2_PUBLIC_IP:5000/api/courses
```

If they go to `http://localhost:5000/...`, `.env.local` was missing or you did not rebuild. Fix env, `npm run build`, `pm2 restart lms-webapp`.

### 5. CORS

Network tab → select an API request → **Headers**.

- If **red** CORS error in Console: API `origin` list must include `http://YOUR_EC2_PUBLIC_IP:3000`. Restart the API.
- If the request is **200** and the page shows courses, CORS is fine.

### 6. Login / register

1. Open `http://YOUR_EC2_PUBLIC_IP:3000/login`.
2. Register a student (or log in).
3. You should land on **My Learning** (student) or **Admin dashboard** (admin).
4. Application → Local Storage should contain `token` and `user`.

If login fails with a CORS error, fix step 8. If you get a JSON error message from the API, the URL is correct; fix credentials or the API itself.

### 7. Admin + student path (full product check)

1. Log in as admin → `/admin/dashboard` shows numbers.
2. Create or publish a course; add a session (video or PDF URL).
3. Enroll a student email on **Enrollments**.
4. Log in as that student → **My Learning** shows the course → open a session.

If the UI works but data does not, the frontend is up and the remaining issue is API, database, or CORS.

---

## Checklist (copy this)

- [ ] EC2 Ubuntu running; you can SSH
- [ ] Security group: 22, 3000, 5000
- [ ] Node 20, git, PM2 installed
- [ ] `lms-webapp` cloned; `npm ci` succeeded
- [ ] `.env.local` has `http://YOUR_EC2_PUBLIC_IP:5000/api` (not localhost)
- [ ] Backend listens on port 5000; laptop can open `/api/courses`
- [ ] Backend CORS allows `http://YOUR_EC2_PUBLIC_IP:3000`
- [ ] `npm run build` succeeded **after** `.env.local` was saved
- [ ] `pm2 start npm --name lms-webapp -- start` is online
- [ ] `pm2 save` and `pm2 startup` done
- [ ] Laptop: site `:3000`, API `:5000`, login works, Network tab uses the EC2 API host

---

## Common failures

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Site never loads | Port 3000 closed or PM2 down | Security group, `pm2 status`, `pm2 logs lms-webapp` |
| Site loads, no courses, login fails | API down or port 5000 closed | API process, SG port 5000, `curl` the API |
| Network tab shows `localhost:5000` | Env not baked in | Set `.env.local`, **rebuild**, `pm2 restart` |
| CORS error in Console | API origin mismatch | Allow `http://IP:3000` on the API, restart API |
| `JavaScript heap out of memory` on build | Small instance | `t3.small`, or `NODE_OPTIONS=--max-old-space-size=1536 npm run build` |
| Works after deploy, dead after reboot | PM2 startup missing | `pm2 startup`, run the sudo command, `pm2 save` |
| Git clone denied | Private repo | PAT or SSH deploy key |

---

## Docker (optional)

Not required if you use PM2 on EC2.

```bash
docker build -t lms-webapp .
docker run -d --name lms-web -p 3000:3000 lms-webapp
```

`NEXT_PUBLIC_*` is still a **build-time** value. Student notes:

1. [dockerignore-guide.md](./dockerignore-guide.md)
2. [dockerfile-demo.md](./dockerfile-demo.md)
3. [multi-stage-build.md](./multi-stage-build.md)

---

## Environment variables

| Name | When it is read | Example on EC2 |
|------|-----------------|----------------|
| `NEXT_PUBLIC_API_URL` | **`npm run build`** | `http://13.232.45.10:5000/api` |

There is no other required env var in this frontend. JWT lives in the browser, not on the server.
