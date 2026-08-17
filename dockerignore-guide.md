# `.dockerignore` Guide (for students)

This file is the **shopping list of things Docker should leave behind** when it builds an image.

If a `Dockerfile` has a line like:

```dockerfile
COPY . .
```

Docker copies the project folder into the image. Without a `.dockerignore`, it also copies junk you do not want: `node_modules`, `.git`, `.env`, docs, editor folders, and so on.

`.dockerignore` works like `.gitignore`, but it is used only during `docker build`.

---

## Why this file matters

| Problem without `.dockerignore` | What goes wrong |
|--------------------------------|-----------------|
| `node_modules` is copied | Wrong OS binaries (Windows/Mac folders inside a Linux image). Builds break or act strangely. |
| `.git` is copied | Image becomes huge. Git history is not needed to run the website. |
| `.env` / `.env.local` is copied | Secrets (passwords, tokens) can end up inside the image. Anyone with the image can read them. |
| `.next` is copied | You mix a laptop build with a Linux container build. That often causes errors. |
| `*.md` and editor folders are copied | Extra size. No benefit at runtime. |

A good `.dockerignore` gives you:

1. **Faster builds** — Docker sends a smaller "build context" to the daemon.
2. **Smaller images** — less unused files inside the container.
3. **Safer images** — secrets stay on your machine.
4. **Correct builds** — Linux containers install Linux packages, not Windows ones.

---

## How Docker uses this file

1. You run `docker build -t lms-webapp .`
2. Docker looks at the current folder (the **build context**).
3. It reads `.dockerignore` first.
4. Matching files are **not** sent to the build.
5. Then Dockerfile instructions like `COPY . .` only see what is left.

If a file is listed in `.dockerignore`, **`COPY` cannot see it**. That is why we ignore `.env*` and instead pass API URLs with `--build-arg` or `-e`.

---

## Pattern rules (simple)

| Pattern | Meaning | Example |
|---------|---------|---------|
| `node_modules` | Ignore that folder | skips `/app/node_modules` |
| `*.log` | Ignore every file ending in `.log` | `npm-debug.log` |
| `.env.*` | Ignore files that start with `.env.` | `.env.local`, `.env.production` |
| `!.env.example` | **Do not** ignore this one (exception) | keeps a sample env file if you want it |
| `Dockerfile*` | Ignore names that start with `Dockerfile` | `Dockerfile`, `Dockerfile.prod` |

Comments start with `#`. Docker skips those lines.

---

## This project's `.dockerignore` (what each group does)

### Git

```
.git
.gitignore
```

The website does not need commit history to run. Leaving `.git` out can save hundreds of megabytes.

### Dependencies

```
node_modules
```

**Very important for Node apps.** Your laptop's `node_modules` was built for Windows or macOS. The Docker image uses Linux (`node:20-alpine`). Let the Dockerfile run `npm ci` so Linux packages are installed inside the image.

### Local build output

```
.next
out
build
dist
```

Next.js writes compiled files to `.next/` when you run `npm run build` on your laptop. The Dockerfile already runs `npm run build` again. Copying an old `.next` folder can cause confusing errors.

### Secrets

```
.env
.env.*
!.env.example
```

This LMS reads `NEXT_PUBLIC_API_URL` from the environment. Real `.env` files must not go into the image. The sample file `.env.example` is allowed if you add one later (it should contain fake/example values only).

### Docs and editor files

```
*.md
.vscode
.idea
.DS_Store
```

README and lesson notes are for you, not for the running container.

### Logs, tests, cache

```
*.log
coverage
*.tsbuildinfo
next-env.d.ts
```

These are leftover from development. They do not belong in production.

### Docker files

```
Dockerfile*
docker-compose*
.dockerignore
```

Docker already reads these from your computer. They do not need to be copied **into** the image.

---

## Common student mistakes

1. **Forgetting `.dockerignore` entirely**  
   Builds are slow. Images are fat. Windows `node_modules` gets copied into Linux.

2. **Ignoring `package.json` by accident**  
   Never ignore `package.json` or `package-lock.json`. The Dockerfile needs them for `npm ci`.

3. **Putting secrets in the image "just for testing"**  
   Even a test image can be shared. Use build args / `docker run -e` instead.

4. **Ignoring `src/` or `public/`**  
   Then `COPY . .` has no app code and `npm run build` fails.

5. **Thinking `.gitignore` is enough**  
   `.gitignore` only affects Git. Docker does **not** use it unless you also list those paths in `.dockerignore`.

---

## Quick check

After you add or edit `.dockerignore`, rebuild:

```bash
docker build -t lms-webapp .
```

If the build fails with "file not found" on `package.json` or `src/`, you ignored something the app needs. Remove that pattern and rebuild.

---

## Related files

- [Dockerfile](./Dockerfile) — the recipe that builds this app
- [dockerfile-demo.md](./dockerfile-demo.md) — how to write, build, and run it
- [multi-stage-build.md](./multi-stage-build.md) — smaller, safer production images
