# Multi-Stage Docker Builds — LMS Web App

This lesson explains **what a multi-stage Dockerfile is**, why the current one-stage file is not optimal, and how to write a **smaller, safer image** for this Next.js frontend.

You should already know how to build and run the simple Dockerfile. If not, read [dockerfile-demo.md](./dockerfile-demo.md) first.

---

## 1. What is a multi-stage build?

A normal Dockerfile has **one** `FROM` line. Everything you install stays in the final image: compilers, `devDependencies`, source files, caches, and the running app.

A **multi-stage** Dockerfile has **two or more** `FROM` lines. Each `FROM` starts a new **stage**. You build in one stage, then **copy only the files you need** into a later stage. The extra tools stay behind.

```
Stage 1 "builder"                    Stage 2 "runner"
─────────────────                    ────────────────
Node + npm                           Small Node image
Install ALL packages                 Copy only:
Compile Next.js                        - built app
Lots of extra files                    - production files
          \                            - start command
           \____ COPY --from=builder → /
```

The **last stage** is the image you tag and run. Earlier stages are discarded (Docker may cache them for faster rebuilds).

Analogy: you use a full kitchen to cook, then you pack **only the meal** into a lunch box. You do not ship the oven.

---

## 2. Why the current Dockerfile is not optimal

The repo `Dockerfile` is a **single-stage** production build:

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

It works, and it is a good first lesson. For a real deployment it has extra weight:

| What stays in the image | Why it is a problem |
|-------------------------|---------------------|
| `devDependencies` (TypeScript, Tailwind, ESLint, types) | Needed to **build**, not to **run** `next start` |
| Full source (`src/`, configs) | Runtime only needs the compiled `.next` output |
| npm cache / build tooling | Larger download, more disk, more files an attacker could inspect |
| One user: `root` | If the process is exploited, it has root inside the container |

Typical result: an image of **several hundred MB** when a runtime-only image can be much smaller.

Multi-stage does not change how the website behaves. It changes **what you ship**.

---

## 3. How a multi-stage Dockerfile is written (generic)

Pattern:

```dockerfile
# ----- stage name -----
FROM some-image AS build
# install + compile here

# ----- final stage -----
FROM smaller-image AS runner
COPY --from=build /path/in/build /path/in/runner
CMD ["the", "start", "command"]
```

Rules that matter:

1. **Name stages** with `AS something` so `COPY --from=something` is readable.
2. **Copy by path.** Nothing is kept unless you `COPY --from=...`.
3. The **final `FROM`** should be as small as possible, still able to run the app.
4. You can have more than two stages (deps / build / runner is common for Node).

---

## 4. Optimized multi-stage Dockerfile for THIS application

This app is Next.js 16. The production server is `next start`, which needs:

- `node_modules` that production actually uses (`next`, `react`, `react-dom`, `lucide-react`)
- the `.next` build folder
- `public/` (static files)
- `package.json` (so `next start` can run)
- `next.config.ts` (Next.js reads it at runtime)

Two practical designs are shown below.

- **Option A** — three stages, still uses `npm run start`. Easier to compare with the current Dockerfile. No change to `next.config.ts`.
- **Option B** — Next.js `output: "standalone"`. Smallest image. Preferred when you are allowed to change config.

---

### Option A — deps / builder / runner (no config change)

Save this as `Dockerfile.multistage` if you want to keep the original `Dockerfile` for class.

```dockerfile
# ============================================
# Stage 1 — install ALL dependencies (including build tools)
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ============================================
# Stage 2 — build the Next.js app
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================
# Stage 3 — run only what production needs
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
```

#### Stage 1 — `deps` (every line)

```dockerfile
FROM node:20-alpine AS deps
```

New stage named `deps`. Same Node 20 Alpine as the simple Dockerfile. The name lets later stages copy from here.

```dockerfile
WORKDIR /app
```

Same idea as before: keep files under `/app`. Each stage has its **own** filesystem. `WORKDIR` must be set again.

```dockerfile
COPY package.json package-lock.json ./
RUN npm ci
```

Install **everything**, including TypeScript and Tailwind. Those are required to compile the app in the next stage. Caching still works: if lockfiles do not change, this layer is reused.

#### Stage 2 — `builder` (every line)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
```

A **fresh** Node image. It does not automatically contain the `deps` files. That is the point of stages.

```dockerfile
COPY --from=deps /app/node_modules ./node_modules
```

Bring in the already-installed packages. `--from=deps` means "from the stage named deps", not from your laptop. This avoids running `npm ci` twice.

```dockerfile
COPY . .
```

Copy source (`src/`, configs, `public/`). `.dockerignore` still applies to this `COPY` from the build context.

```dockerfile
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

Build-time API URL. Next.js inlines `NEXT_PUBLIC_*` during `next build`. Default matches local Docker labs (browser → `localhost:5000`). Override with `--build-arg` when needed.

```dockerfile
ENV NEXT_TELEMETRY_DISABLED=1
```

Stops Next.js from trying to send anonymous telemetry during the build (cleaner logs in class/CI).

```dockerfile
RUN npm run build
```

Creates `/app/.next`. This stage can stay large. It will not be the image you run.

#### Stage 3 — `runner` (every line)

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
```

Third fresh image. **No source, no TypeScript, no first `node_modules` yet.** This is what you ship.

```dockerfile
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
```

Create a non-root user. Alpine's `adduser` / `addgroup` with `-S` make a system user. If the Node process is compromised, it does not run as root inside the container.

```dockerfile
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
```

Install **production** packages only (`next`, `react`, `react-dom`, `lucide-react`). `--omit=dev` skips TypeScript, ESLint, Tailwind CLI, and type packages. `npm cache clean` deletes the download cache so it is not left in the layer.

```dockerfile
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
```

Only runtime files from the builder:

- `.next` — compiled website
- `public` — static assets
- `next.config.ts` — Next.js reads this when the server starts (image remote patterns, etc.)

We do **not** copy `src/`. The compiled output is enough for `next start`.

```dockerfile
USER nextjs
```

Drop root. Later `CMD` runs as `nextjs`. Files we copied are usually world-readable; the process only needs to read them and listen on 3000.

```dockerfile
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Same start command as the simple Dockerfile. Publish with `-p 3000:3000` when you run the container.

---

### Option B — Next.js standalone (smallest)

Next.js can emit a **standalone** folder: a tiny Node server plus only the files it needs. Then the runner does not even need `npm ci`.

**1. Change `next.config.ts`:**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
```

`output: "standalone"` tells `next build` to write `.next/standalone` (a minimal server) and `.next/static`.

**2. Dockerfile:**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Extra lines in Option B

```dockerfile
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
```

The standalone server is `node server.js`. `HOSTNAME=0.0.0.0` makes it listen on all interfaces so `docker run -p 3000:3000` works. If it only listened on `127.0.0.1` **inside** the container, your browser could not reach it.

```dockerfile
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
```

- `standalone` already contains `server.js` and a trimmed `node_modules`.
- `.next/static` must be copied next to it; Next.js expects that path.
- `--chown=nextjs:nodejs` sets file owner so the non-root user can read them.

```dockerfile
CMD ["node", "server.js"]
```

No `npm` in the start command. Slightly faster startup, fewer packages.

---

## 5. Build and run the optimized image

From the project root.

**Option A** (file named `Dockerfile.multistage`):

```bash
docker build -f Dockerfile.multistage -t lms-webapp:slim .
docker run -d --name lms-web -p 3000:3000 lms-webapp:slim
```

**Option B** (after adding `output: "standalone"`, using `-f` if the file is not named `Dockerfile`):

```bash
docker build -t lms-webapp:standalone .
docker run -d --name lms-web -p 3000:3000 lms-webapp:standalone
```

Compare sizes:

```bash
docker images lms-webapp
```

You should see the multi-stage tags smaller than the original single-stage image.

Connecting to a backend container on port 5000 is **unchanged**: the browser still calls `http://localhost:5000/api`. Put both containers on one network and publish 3000 and 5000. Full steps are in [dockerfile-demo.md](./dockerfile-demo.md#5-connect-this-container-to-a-backend-container-on-port-5000).

Custom API URL at build time:

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000/api -t lms-webapp:slim -f Dockerfile.multistage .
```

---

## 6. Single-stage vs multi-stage (this project)

| Topic | Current `Dockerfile` | Multi-stage |
|-------|----------------------|-------------|
| `FROM` lines | 1 | 2 or 3 |
| Image contents | Source + all npm packages + `.next` | Mostly runtime files |
| `devDependencies` in final image | Yes | No (Option A omits them; Option B uses standalone) |
| Runs as | root | `nextjs` user |
| Best for | Learning the basics | Production / sharing images |
| Harder to read? | Easier | A bit more to learn, same `docker run` |

---

## 7. Student pitfalls

1. **Forgetting `.dockerignore`**  
   Multi-stage does not save you from copying Windows `node_modules` into the builder. Keep ignoring `node_modules` and `.next`.

2. **Copying `src/` into the runner "just in case"**  
   That undoes most of the size win. `next start` / `server.js` do not need TypeScript source.

3. **Setting `NEXT_PUBLIC_API_URL` only on `docker run -e`**  
   Too late. It must exist during `RUN npm run build` (`ARG` + `ENV` in the builder stage).

4. **`USER nextjs` then installing packages**  
   `npm ci` in the runner must run **before** `USER nextjs` (needs permission to write `node_modules`). Option B copies files with `--chown` instead.

5. **Standalone without `output: "standalone"`**  
   Then `.next/standalone` does not exist and `COPY` fails.

6. **Thinking multi-stage changes ports**  
   Frontend is still 3000. Backend is still 5000. The browser still uses `localhost`.

---

## 8. What you should remember

- Multi-stage = several `FROM` blocks; only the last image is what you run.
- `COPY --from=stagename` is how files move between stages.
- Build tools stay in the builder; the runner stays small.
- For this LMS frontend, Option A is the direct upgrade of the class Dockerfile; Option B is the usual Next.js production pattern.
- Networking with the API container does not change: publish port 5000 and use `http://localhost:5000/api` from the browser.
