# ChatterCabin

ChatterCabin is a standalone Django, Channels, and React real-time chat app. It
uses Django's standard user model and supports real-time rooms over WebSockets.

## Requirements

- Python 3.12 or newer
- Node.js `20.19+` or `22.12+`
- Redis, with the `redis-server` command available on `PATH`

## Quick start

Create a virtual environment and install the Python dependencies.

macOS or Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/run_dev.py
```

Windows PowerShell:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python scripts/run_dev.py
```

On its first run, the launcher installs the locked frontend dependencies. On
every run it builds React, applies database migrations, starts its own temporary
Redis and Django processes, and opens `http://127.0.0.1:8000`. Stop the launcher
with Ctrl+C or the IDE Stop button; it also stops the Redis and Django processes
it created.

Do not start another Redis instance on port 6379 when using the launcher. The
launcher deliberately owns that port so it can guarantee clean shutdown.

### One-click PyCharm run

Choose **ChatterCabin Full Stack** in the run-configuration menu and press Run.
Select a project interpreter with the requirements installed. The shared run
configuration calls the same launcher described above, so Run and Stop control
the complete local stack.

### Frontend development

The complete frontend is in `chattercabin_frontend/`, which can be opened as a
standalone WebStorm project. From that directory, run `npm ci` once and then
`npm start` for Vite on port 5173 while Django and Redis are running. API and
WebSocket requests are proxied to Django on port 8000. The full-stack launcher
uses the production build instead, giving the combined app one URL and one
browser login state.

## Environment variables

- `DEBUG`: defaults to `true`; set to `false` in production.
- `DJANGO_SECRET_KEY`: required when `DEBUG=false`.
- `ALLOWED_HOSTS`: comma-separated hostnames.
- `CSRF_TRUSTED_ORIGINS`: comma-separated HTTPS origins.
- `DATABASE_URL`: optional; defaults to local SQLite.
- `REDIS_URL`: optional; defaults to local Redis.

The application reads variables from the process environment. `.env.example`
is a reference for IDE, shell, or deployment configuration; it is not loaded
automatically. The default development configuration works without setting any
variables. On the first local run, Django generates a unique secret in
`.django_secret_key`; that file is reused on later runs and excluded from Git.
Delete it only when you intentionally want to rotate the local development key.

Local state such as `.env`, virtual environments, SQLite databases, dependency
folders, caches, and build output is intentionally excluded from Git.

The React production build is generated in `chattercabin_frontend/build/` and
is intentionally not committed. Django's `staticfiles/` directory is also
generated and is never source code. For a generic production deployment, build
the frontend first and then collect Django's static files:

```bash
npm --prefix chattercabin_frontend run build
python manage.py collectstatic --noinput
```

Run the ASGI application with an ASGI-compatible server. For example:

```bash
daphne ChatterCabin.asgi:application
```

## Tests

```bash
npm --prefix chattercabin_frontend run build
python manage.py test
```
