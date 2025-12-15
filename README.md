# bandland

Modern, TypeScript-first band landing page built with Next.js.

Design + theme guidelines live in `AGENTS.md`.

## Local dev

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build & run

```bash
npm run build
npm run start
```

## Deployment

### Vercel

- Import the repo and deploy.
- Optionally set `NEXT_PUBLIC_SITE_URL` to your canonical URL.

### Docker (portable)

```bash
docker build -t bandland .
docker run --rm -p 3000:3000 --env NEXT_PUBLIC_SITE_URL=http://localhost:3000 bandland
```
