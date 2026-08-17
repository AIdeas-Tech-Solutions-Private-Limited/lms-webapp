# Dockerfile Demo — LMS Web App

This lesson teaches you how to put **this** Next.js website into a Docker image, run a container, and connect it to a **backend API container on port 5000**.

Read [dockerignore-guide.md](./dockerignore-guide.md) first so `COPY . .` does not pull in `node_modules` and secrets.

---

## 1. What is a Dockerfile?

A **Dockerfile** is a text file of instructions. Docker reads it from top to bottom and produces an **image** (a snapshot of the app + the tools it needs).

From an image you start a **container** (a running copy).

Simple picture:

```
Dockerfile  →  docker build  →  image  →  docker run  →  container (the live app)
```

- **Image** = recipe result (can be copied, tagged, pushed).
- **Container** = one running instance of that image.

This project already has a file named `Dockerfile` in the project root.

---

## 2. How to write a Dockerfile for a customized application

Every app is different, but the **thinking process** is the same. Write the file by answering these questions in order.

### Step A — What kind of app is this?

Ask:

- What language/runtime? (Node, Python, Java, Go, ...)
- How do I install libraries?
- How do I build it?
- What command starts it?
- Which port does it listen on?
- Does it need environment variables?

For **this** repo the answers are:

| Question | Answer for `lms-webapp` |
|----------|-------------------------|
| Runtime | Node.js 20 |
| Install | `npm ci` (uses `package-lock.json`) |
| Build | `npm run build` (Next.js production build) |
| Start | `npm run start` (Next.js production server) |
| Port | `3000` |
| Extra config | `NEXT_PUBLIC_API_URL` so the browser can call the API |

### Step B — Pick a base image

Start `FROM` an official image that already has the runtime:

```dockerfile
FROM node:20-alpine
```

- `node:20` matches this project's Node version.
- `-alpine` is a small Linux. Smaller images download faster.

Use a version number (`20`), not `latest`, so classmates get the same result months later.

### Step C — Set a working folder

```dockerfile
WORKDIR /app
```

All later commands run inside `/app` in the image. You do not need `cd /app` on every line.

### Step D — Copy lockfiles first, then install

Copy **only** `package.json` and `package-lock.json`, then install. Do this **before** copying the rest of the source.

Why? Docker **caches** each step. If you only change a React page, Docker can reuse the cached `npm ci` layer. If you copy the whole project first, every tiny edit forces a full reinstall.

```dockerfile
COPY package.json package-lock.json ./
RUN npm ci
```

`npm ci` is better than `npm install` in Docker:

- it follows the lockfile exactly (same versions for every student)
- it fails if the lockfile is out of date (safer than silently changing versions)

### Step E — Copy the application code

```dockerfile
COPY . .
```

This copies the rest of the project. Combined with `.dockerignore`, Docker skips `node_modules`, `.git`, `.env`, docs, and so on.

### Step F — Build the app (if it needs a build)

Next.js is not "just run `index.js`". You must compile it:

```dockerfile
RUN npm run build
```

This creates the `.next` folder **inside the image**.

### Step G — Configure runtime

Set environment, document the port, and choose the start command:

```dockerfile
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Use **exec form** `CMD ["npm", "run", "start"]` (JSON array). It starts the process directly and handles stop signals better than `CMD npm run start`.

### Step H — Ignore junk

A Dockerfile without `.dockerignore` is incomplete. See [dockerignore-guide.md](./dockerignore-guide.md).

### Checklist you can reuse for other apps

1. `FROM` the right runtime image and version.
2. `WORKDIR` so paths stay short and consistent.
3. Copy **dependency files only**, then install (cache-friendly).
4. Copy **source**, then build.
5. Set `ENV`, `EXPOSE`, and `CMD`.
6. Add `.dockerignore`.
7. Build, run, test in a browser.
8. Only then think about multi-stage builds ([multi-stage-build.md](./multi-stage-build.md)).

---

## 3. The Dockerfile for THIS application (every line)

This is the current `Dockerfile` in the repo. Each line is explained below.

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]
```

### Line 1 — `FROM node:20-alpine`

**What:** Start from a public image that already has Node.js 20 on Alpine Linux.

**Why:** You should not invent Linux + Node from scratch. Official images are maintained and small enough for classwork.

**Why 20?** `package.json` depends on modern Next.js/React. Node 20 is a current LTS that matches local development.

**Why Alpine?** It is a tiny Linux. The image is lighter than `node:20` (Debian). Alpine uses `musl` instead of `glibc`; most pure JavaScript apps (this one) are fine.

### Line 3 — `WORKDIR /app`

**What:** Create `/app` if needed, and make it the current directory.

**Why:** Keeps all app files in one place. `COPY`, `RUN`, and `CMD` now use `/app` automatically.

**What if you skip it?** Files might land in `/` (the Linux root). That is messy and easy to break.

### Line 5 — `COPY package.json package-lock.json ./`

**What:** Copy those two files from your computer into `/app` in the image.

**Why only these two?**

- `package.json` lists packages and scripts (`build`, `start`).
- `package-lock.json` pins exact versions.

Copying them **alone** lets Docker cache `npm ci`. The `./` means "put them in the current `WORKDIR`".

**Do not skip the lockfile.** Without it, `npm ci` fails, and classmates might install different versions.

### Line 7 — `RUN npm ci`

**What:** Install dependencies **inside the image** during `docker build`.

**Why `npm ci`?** Clean Install from the lockfile. Same packages every time.

**Why not copy `node_modules` from your laptop?** Your laptop may be Windows. The container is Linux. Native modules would be wrong. `.dockerignore` already excludes `node_modules` so this install is a fresh Linux one.

**Note:** This installs **all** packages, including `devDependencies` (TypeScript, Tailwind, ESLint). Next.js needs those tools to **build**. A later [multi-stage build](./multi-stage-build.md) can drop them from the final image.

### Line 9 — `COPY . .`

**What:** Copy everything left in the build context into `/app`.

- First `.` = folder on your machine (the build context, usually the project root).
- Second `.` = `/app` inside the image.

**What actually gets copied?** Everything **except** paths in `.dockerignore` (`node_modules`, `.git`, `.env*`, `*.md`, `.next`, ...).

**Why after `npm ci`?** So a change in `src/` does not redo the slow install step.

### Line 11 — `RUN npm run build`

**What:** Run the `build` script from `package.json`, which is `next build`.

**Why:** Production Next.js needs a compiled `.next` folder. `npm run start` will not work without it.

**This runs at image build time**, not when the container starts. Starting a container is then faster: it only runs the web server.

**About `NEXT_PUBLIC_API_URL`:** Next.js inlines `NEXT_PUBLIC_*` values **while building**. This Dockerfile does not set that variable, so the app uses the fallback in `src/lib/api.ts`:

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
```

That fallback is correct for local Docker + a backend published on `localhost:5000`. To bake in another URL, see [section 6](#6-optional--pass-the-api-url-at-build-time).

### Line 13 — `ENV NODE_ENV=production`

**What:** Set an environment variable inside the image.

**Why:** Many Node libraries behave differently in production (less debug logging, better caching). Next.js `next start` expects a production build.

This does **not** uninstall `devDependencies`. Those were already installed by `npm ci`. Multi-stage builds are the way to leave them out of the final image.

### Line 15 — `EXPOSE 3000`

**What:** Documents that the process listens on port 3000.

**Why:** Next.js `next start` defaults to 3000. `EXPOSE` does **not** publish the port to your computer. Publishing happens when you run:

```bash
docker run -p 3000:3000 ...
```

Think of `EXPOSE` as a label for humans and tools. `-p` is what actually opens the door.

### Line 17 — `CMD ["npm", "run", "start"]`

**What:** Default command when a container starts. That script is `next start`.

**Why `CMD` and not `RUN`?** `RUN` happens at **build** time. `CMD` happens at **run** time. You build once; you start the server every time a container starts.

**Why the JSON array?** Exec form. Docker runs `npm` directly, not inside a shell. Easier to stop the container cleanly.

You can override `CMD` for a one-off test:

```bash
docker run --rm lms-webapp node -v
```

---

## 4. Step-by-step: write, build, and run

Do this from the **project root** (`lms-webapp`), the folder that contains `Dockerfile` and `package.json`.

### Step 1 — Confirm Docker works

```bash
docker version
docker info
```

If these fail, start Docker Desktop (or your Docker engine) and try again.

### Step 2 — Confirm the files exist

You need at least:

- `Dockerfile`
- `.dockerignore`
- `package.json`
- `package-lock.json`
- `src/`

### Step 3 — (Optional) Create or edit the Dockerfile

If you are writing it yourself, create a file named `Dockerfile` (no extension) with the contents from [section 3](#3-the-dockerfile-for-this-application-every-line). Save it next to `package.json`.

### Step 4 — Make sure `.dockerignore` is in place

Without it, Windows `node_modules` may be copied into a Linux image. Use the file in this repo, or follow [dockerignore-guide.md](./dockerignore-guide.md).

### Step 5 — Build the image

```bash
docker build -t lms-webapp .
```

What this means:

| Part | Meaning |
|------|---------|
| `docker build` | Read the Dockerfile and create an image |
| `-t lms-webapp` | Name (tag) the image `lms-webapp` so you do not need a long hash |
| `.` | Build context = this folder |

The first build downloads `node:20-alpine` and runs `npm ci` / `npm run build`. That can take several minutes. Later builds are faster if Docker can reuse layers.

Watch for:

- `npm ci` finishing without errors
- `next build` finishing with a successful compile
- a final `Successfully tagged lms-webapp:latest`

List images:

```bash
docker images
```

You should see `lms-webapp`.

If the build fails:

- **Cannot find `package-lock.json`** — that file must be in the repo and not ignored.
- **`npm ci` error** — run `npm install` locally, commit an updated lockfile, rebuild.
- **`next build` error** — the same project must build on your machine with `npm run build`.
- **Out of disk / memory** — free space, or close other programs.

### Step 6 — Run a container

```bash
docker run -d --name lms-web -p 3000:3000 lms-webapp
```

| Part | Meaning |
|------|---------|
| `docker run` | Start a container from an image |
| `-d` | Detached (runs in the background) |
| `--name lms-web` | Easy name for `docker logs` / `docker stop` |
| `-p 3000:3000` | `hostPort:containerPort` — your computer's 3000 maps to the app's 3000 |
| `lms-webapp` | Image name from `-t` |

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
docker ps                 # is it running?
docker logs lms-web       # Next.js output
docker logs -f lms-web    # follow logs
docker stop lms-web       # stop
docker start lms-web      # start again
docker rm lms-web         # delete the container (image stays)
```

If port 3000 is already used (for example `npm run dev` is still running):

```bash
docker run -d --name lms-web -p 3001:3000 lms-webapp
```

Then open [http://localhost:3001](http://localhost:3001). The **left** number is the port on your computer. The **right** number must stay `3000` because that is where Next.js listens inside the container.

### Step 7 — Stop and clean up (when you are done)

```bash
docker stop lms-web
docker rm lms-web
```

Delete the image only if you want to rebuild from scratch:

```bash
docker rmi lms-webapp
```

---

## 5. Connect this container to a backend container on port 5000

This website is the **frontend**. It does not contain course data. `src/lib/api.ts` sends HTTP requests to:

```text
http://localhost:5000/api
```

unless you set `NEXT_PUBLIC_API_URL`.

Login, course lists, enrollments, and progress all go to that API.

### 5.1 The important idea: the browser makes the API calls

Most pages in this app are client-side React. They use `fetch` plus a token in `localStorage`.

So the path is:

```
Your browser
   ├─ loads the website from  http://localhost:3000   (frontend container)
   └─ calls the API at        http://localhost:5000/api  (backend container)
```

The **browser** must reach port 5000. A Docker-only hostname such as `http://lms-api:5000` works **between containers**, but **not** from Chrome/Edge/Firefox on your computer.

That is why we publish the backend port:

```bash
docker run ... -p 5000:5000 ...
```

and keep:

```text
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

`localhost` here means **your computer**, which forwards 5000 into the backend container.

```
[ Browser on your PC ]
        |  :3000                    |  :5000
        v                           v
[ frontend container ]      [ backend container ]
   Next.js :3000               API :5000
```

### 5.2 Create a Docker network (recommended)

Containers on the same user-defined network can reach each other by name. Publishing ports still lets the browser in.

```bash
docker network create lms-net
```

You only need to create the network once.

### 5.3 Start the backend container first

Use your real backend image name if it is different.

```bash
docker run -d ^
  --name lms-api ^
  --network lms-net ^
  -p 5000:5000 ^
  lms-api
```

On macOS/Linux, replace `^` with `\`.

One line version:

```bash
docker run -d --name lms-api --network lms-net -p 5000:5000 lms-api
```

Check it:

```bash
docker ps
```

You should see port `5000->5000`. Quick test from your computer:

```bash
curl http://localhost:5000/api/courses
```

(or open that URL in a browser). If this fails, the frontend will fail too.

The backend must allow CORS from `http://localhost:3000` (the origin of the website).

### 5.4 Start the frontend container on the same network

```bash
docker run -d --name lms-web --network lms-net -p 3000:3000 lms-webapp
```

Both containers are on `lms-net`. The browser still uses `localhost:3000` and `localhost:5000`.

### 5.5 Full sequence (copy-paste)

```bash
docker network create lms-net

docker run -d --name lms-api --network lms-net -p 5000:5000 lms-api

docker build -t lms-webapp .

docker run -d --name lms-web --network lms-net -p 3000:3000 lms-webapp
```

Then:

1. Open [http://localhost:3000](http://localhost:3000)
2. Register or log in
3. If login fails, check `docker logs lms-api` and `docker logs lms-web`, and confirm [http://localhost:5000/api](http://localhost:5000/api) responds

### 5.6 If the backend already runs on your machine (not in Docker)

You only need the frontend container:

```bash
docker run -d --name lms-web -p 3000:3000 lms-webapp
```

The browser still calls `http://localhost:5000/api` on your machine. That works because API calls do not go "frontend container → backend". They go "browser → backend".

### 5.7 Common mistakes

| Mistake | What you see | Fix |
|---------|----------------|-----|
| Backend not started | Login/courses fail, network error | Start the API container (or local API) first |
| Forgot `-p 5000:5000` | Browser cannot open `localhost:5000` | Publish the port |
| Set API URL to `http://lms-api:5000/api` | Works inside Docker, **fails in the browser** | Use `http://localhost:5000/api` for this app |
| Frontend on 3000, backend CORS missing | Browser console CORS error | Allow origin `http://localhost:3000` on the API |
| Changed `NEXT_PUBLIC_API_URL` but did not rebuild | Old URL still used | Rebuild the image (`NEXT_PUBLIC_*` is baked in at build) |
| Two containers, different networks | Container DNS names fail | Put both on `lms-net` |
| Used `--link` | Old, confusing | Use a user-defined network instead |

### 5.8 Optional: Docker Compose sketch

Compose starts both services with one command. This repo may not include a compose file; this is an example you can save as `docker-compose.yml` if you also have a backend image:

```yaml
services:
  api:
    image: lms-api
    ports:
      - "5000:5000"
    networks:
      - lms-net

  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - api
    networks:
      - lms-net

networks:
  lms-net:
```

```bash
docker compose up --build
```

The browser still uses `localhost:3000` and `localhost:5000`. `depends_on` only waits until the API **container starts**, not until the API is fully ready.

---

## 6. Optional — pass the API URL at build time

This app's current Dockerfile relies on the code fallback `http://localhost:5000/api`. That is enough for class labs on one computer.

If you need another public URL, you must pass it **before** `npm run build`, because Next.js bakes `NEXT_PUBLIC_*` into the JavaScript.

Example change to the Dockerfile:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Build with a custom value:

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000/api -t lms-webapp .
```

- `ARG` is available at **build** time.
- `ENV` keeps the value in the image so Next.js can read it during `RUN npm run build`.

Do not put real secrets in `NEXT_PUBLIC_*` variables. Anything with that prefix is visible in the browser.

---

## 7. What you should be able to explain after this lesson

1. A Dockerfile is a recipe; an image is the result; a container is a running copy.
2. Why we copy `package.json` before the rest of the source.
3. Why `.dockerignore` must exclude `node_modules` and `.env`.
4. Why `EXPOSE 3000` is not the same as `-p 3000:3000`.
5. Why this frontend talks to `localhost:5000` from the **browser**, even when both apps run in containers.
6. How to put frontend and backend on the same Docker network and publish ports 3000 and 5000.

Next lesson: [multi-stage-build.md](./multi-stage-build.md) — make a smaller, safer image for the same app.
