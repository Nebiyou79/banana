# Banana Link

Multi-role job and tender platform (Candidate, Freelancer, Company, Organization, Admin).

## Structure

| Directory   | Stack                     |
| ----------- | ------------------------- |
| `server/`   | Node.js, Express, MongoDB |
| `frontend/` | Next.js                   |
| `mobile/`   | React Native (Expo)       |

## Docs

- [`.claude/CLAUDE.md`](.claude/CLAUDE.md) — project source of truth for AI and architecture
- [`docs/`](docs/) — specs, Postman collections, and design notes

## Run locally

```bash
# Backend (port 4000)
cd server && npm install && npm run dev

# Frontend (port 3000)
cd frontend && npm install && npm run dev
```

MongoDB must be running (local or Docker). See `server/.env` for required environment variables.
