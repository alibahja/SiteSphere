# SiteSphere

An AI website builder. Describe a website in plain English and get a working, editable, publishable React project.

The project Formly grew out of — built to explore two-phase AI generation (plan, then per-file code generation), live in-browser editing via Sandpack, and full-stack cookie auth.

## Features

- **Generate a website from a prompt** — e.g. "a portfolio with hero, about, projects, and contact sections" becomes a real React codebase of 5-11 files.
- **Live code editing** — the generated project runs in-browser via Sandpack, with edits auto-saved to the database.
- **Chat-based revisions** — ask the AI to change a section, add a feature, or fix a component; changes are applied as search/replace operations against the codebase.
- **Export as a project** — download the whole project as a ZIP with a working `package.json` and Vite config.
- **Publish and share** — publish a project to get a public URL where anyone can view the generated site.

## Stack

**Backend:** Node.js, Express 4, MongoDB/Mongoose, JWT sessions (HTTP-only cookies), Zod, OpenRouter via Vercel AI SDK, `p-map` for concurrency-limited file generation.

**Frontend:** React 18, Vite, Tailwind CSS v4, Sandpack (`@codesandbox/sandpack-react`) for in-browser preview, React Router, Axios, React Hot Toast, Lucide icons.

## Architecture

```
Client (React + Sandpack)
    │  HTTP (axios, withCredentials)
    ▼
Server (Express)
    ├── /api/auth       → authController
    ├── /api/projects   → projectController (CRUD + generation)
    │                    → chatController (AI revisions)
    ├── middleware/     → authMiddleware
    ├── services/       → ai.js (LLM calls), diff.js (search/replace),
    │                     codeValidator.js, contentNormalizer.js
    └── models/         → User, Project
    ▼
MongoDB
```

**Two-phase generation:**

```
POST /api/projects { prompt }
  → Project.create({ status: "pending" })   responds 201 immediately
  → runBackgroundGeneration() (no await)
      Phase 1: plan file structure          → onPlan callback updates DB
      Phase 2: generate files in parallel   → onFileStart / onFileComplete callbacks
                                               (concurrency = 6, up to 2 retries)
  → status: "completed", version = 1
```

The client polls every 2s while status is `pending`, `generating`, or `revising`.

**Revision flow:**

```
POST /api/projects/:id/chat { prompt }
  → reviseProject()      returns { operations, description }
  → applyOperations()    create / update / delete file ops
                          (search/replace with whitespace-normalized fallback)
  → Project.save(...)    version + 1
```

## Design notes

- **Two-phase generation.** Planning and per-file generation are separate, smaller AI calls — each more reliable than one large call, and the plan lets files generate in parallel without guessing dependencies.
- **Concurrency-limited generation.** Files generate 6 at a time with retry rounds on failure; anything that never succeeds gets a placeholder, so a broken generation still produces a loadable project.
- **Code validation pipeline.** Every generated file passes through `normalizeContent` (fixes double-escaped strings) and `validateAndFixCode` (nine regex-based fixes: `class` → `className`, self-closing void elements, ensuring a default export, correcting import paths against the known file tree, stripping TypeScript syntax, etc.). The import-path fix carries the most weight — the AI frequently references files by the wrong relative path, and the validator corrects it against the actual tree.
- **Mixed-type files field.** `Project.files` is a `Schema.Types.Mixed` map, since file paths are dynamic and Mongoose can't validate the shape. Callers must call `project.markModified("files")` after mutating, or `.save()` silently skips the write.
- **Search/replace revisions with fallback.** Updates send a `search` string that must exactly match a substring of the current file; on failure, the diff service retries with whitespace-normalized, line-by-line matching to tolerate minor indentation differences.

## Running locally

**Prerequisites:** Node 18+, MongoDB (local or Atlas), an OpenRouter API key.

### Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sitesphere
JWT_SECRET=your-long-random-secret
ORIGINS=http://localhost:5173
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openai/gpt-4o-mini
AI_MAX_CONCURRENCY=6
```

```bash
npm run dev
```

### Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

Visit `http://localhost:5173`.

## Project structure

```
server/
├── config/db.js
├── models/            (user, project)
├── middleware/        (authMiddleware)
├── controllers/       (authController, projectController, chatController)
├── services/          (aiSchemas, prompts, ai, contentNormalizer, codeValidator, diff)
├── routes/            (authRoutes, projectRoutes)
└── server.js

client/
├── src/
│   ├── api/api.js
│   ├── components/    (PromptInput, ChatPanel, PreviewPanel, ...)
│   ├── context/AppContext.jsx
│   ├── pages/          (Home, AuthPage, BuilderPage, Preview, PublishPage)
│   ├── App.jsx
│   └── main.jsx
└── index.html
```

## Known limitations

- Generation takes 30-90 seconds — 11 files at ~5s each with retries is inherently slow, so the client polls for progress.
- AI code quality depends on the model; GPT-4o-mini and Claude 3.5 Sonnet produce consistently valid JSX, weaker models often need the validator to fix structural problems.
- A failed search/replace revision (e.g. from whitespace drift) is logged and skipped rather than silently corrupting the file.
- No live collaboration — one user editing a project at a time; concurrent edits would race.
- Sandpack remounts on every version bump, losing scroll position and cursor state.

## License

MIT
