# Dev Method

- Use `Skill(claude-bot)` for developing.

# Browser Testing (Playwright via Docker)

Use the browser container to take screenshots and verify pages — both local dev and deployed site.

## Setup
```bash
docker compose --profile browser up -d browser
```