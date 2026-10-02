# HelpDesk — Frontend

React 19 + Vite 7 + Tailwind CSS 4 client for the HelpDesk Ticket Management System.

Setup, environment variables, features and the API are documented in the
[main README](../README.md).

## Quick start

```bash
npm install
cp .env.example .env   # set VITE_API_URL (and Firebase keys for Google sign-in)
npm run dev            # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the unit tests (Vitest) |
