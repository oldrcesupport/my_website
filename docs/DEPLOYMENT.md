# Deployment and local setup

The application is **not ready for production**. The current container and
Nginx configuration is a draft; required variables, setup, migration, TLS and
backup/restore instructions and their verification limits are in
[PRODUCTION_DRAFT.md](PRODUCTION_DRAFT.md). Do not enable live payments before
resolving the provider-contract and operational blockers there.

For local development, use Python 3.14, Node.js and PostgreSQL. Prepare your
own development environment values from `.env.example`; generate independent
keys and a database password, and never overwrite an existing environment file.
Compose requires `DB_PASSWORD` in the shell or root `.env`; the backend reads
`backend/.env`. Run `docker compose up -d db`, install backend requirements,
run `python manage.py migrate`, and start Django on `127.0.0.1:8000`. Initial
staff creation requires explicit credentials; no default password is provided.
In `frontend`, run `npm ci` and `npm run dev`.

Use the same browser origin for the UI and API, with the Next rewrite or a
properly configured reverse proxy. The isolated browser sandbox helper under
`backend/tests` requires `APP_ENV=testing` and a `codex_browser_` database; it
is excluded from the backend container and is not a production configuration.

Never point mock payments or browser test helpers at production data. Sandbox
has been exercised locally, not as a deployed TLS system. Localhost callback
URLs work only in the local browser flow and are not a public deployment URL.
