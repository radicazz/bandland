# Bandland

Band landing page for schmät, styled as a photocopied punk zine (cream paper, black ink, one red, torn edges, halftone band photos). `/admin` keeps a dark monochrome theme. Built with Next.js 16, React 19, Tailwind CSS 4, TypeScript, and Vercel Blob.

Design and project rules live in `AGENTS.md` and `DESIGN.md`. Vercel is the only supported deployment target.

## Local development

Connect the checkout to its Vercel project and pull the Development environment:

```bash
npm install
npx vercel link
npx vercel env pull .env.local
npm run dev
```

The local admin uses the `development` namespace in the connected Blob stores, so it cannot overwrite production content. Open http://localhost:3000 and sign in at `/admin`.

Generate new admin credentials with:

```bash
npm run auth:generate
```

Copy the generated `ADMIN_PASSWORD_HASH` and `AUTH_SECRET` into the appropriate Vercel environments. Do not commit them.

## Content and assets

- Shows, merch, and the capped audit log live in the private content Blob store.
- Admin photos upload directly to the public media Blob store and render through `next/image`.
- Site identity and social links live in `src/config/site.ts`.
- Translations live in `src/i18n/translations.ts`.
- Band photos: processed black-and-white crops in `public/photos/` (used on the pages) made from the originals in `public/slideshow/` (OG/Twitter images via `src/config/embed.ts`).
- The featured track for the Play button is `public/audio/engel-uit-die-hemel.mp3` (`site.featuredTrack`).

Production intentionally starts empty. Add the first shows and merch through `/admin` after deployment.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

After linking the project, use `npx vercel build` for a platform-level build check.

## Deployment

Pushes and pull requests deploy through Vercel's Git integration. There are no supported VPS, container, systemd, or custom deploy-script paths.

See [docs/deployment.md](docs/deployment.md) for Blob stores, environment scopes, Preview behavior, the required login rate-limit rule, domains, and rollback.

## Licensing

Code is MIT licensed under [LICENSE](LICENSE). Brand assets under `public/logos/`, `public/slideshow/`, `public/photos/`, `public/audio/`, and other band artwork are proprietary and covered by [LICENSE.ASSETS](LICENSE.ASSETS).
