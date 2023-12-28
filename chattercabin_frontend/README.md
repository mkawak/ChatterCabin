# ChatterCabin frontend

This directory is the complete React/Vite frontend and can be opened directly
as a project in WebStorm.

```bash
npm ci
npm start
```

The Vite development server runs at `http://127.0.0.1:5173` and proxies API and
WebSocket requests to Django at `http://127.0.0.1:8000`.

```bash
npm run build
```

Production output is generated in `chattercabin_frontend/build/`. Django serves
that build at port 8000 when the full project is run from PyCharm.
