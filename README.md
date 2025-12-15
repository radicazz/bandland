# bandland

Modern, TypeScript-first band landing page built with Next.js 16, React 19, and Tailwind CSS 4.

**Design + theme guidelines live in `AGENTS.md`.**

## Prerequisites

- **Node.js**: v22 (see `.nvmrc`)
- **npm**: Included with Node.js

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Build for production |
| `npm run start` | Run production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without writing |

## Project Structure

```
bandland/
├── content/              # Content data (JSON)
│   ├── shows.json       # Tour dates & venue info
│   └── merch.json       # Merch items & store links
├── public/              # Static assets
├── src/
│   ├── __tests__/       # Test files
│   ├── app/             # Next.js App Router
│   │   ├── layout.tsx   # Root layout
│   │   ├── page.tsx     # Home page
│   │   ├── shows/       # Shows page
│   │   ├── merch/       # Merch page
│   │   ├── globals.css  # Global styles + design tokens
│   │   ├── sitemap.ts   # Dynamic sitemap generation
│   │   ├── robots.ts    # Robots.txt
│   │   ├── opengraph-image.tsx   # OG image
│   │   └── twitter-image.tsx     # Twitter card
│   ├── components/      # Reusable UI components
│   │   ├── Container.tsx
│   │   ├── SiteHeader.tsx
│   │   └── SiteFooter.tsx
│   ├── config/          # Site configuration
│   │   └── site.ts      # Name, description, socials, etc.
│   └── content/         # Content schema & loaders
│       ├── schema.ts    # Zod schemas for validation
│       ├── shows.ts     # Shows data loader
│       └── merch.ts     # Merch data loader
├── AGENTS.md            # Design & theme guidelines
├── Dockerfile           # Production Docker image
└── package.json
```

## Content Management

### Editing Shows

Edit `content/shows.json`:

```json
[
  {
    "id": "unique-id",
    "date": "2025-03-15T20:00:00-05:00",
    "venue": "The Basement",
    "city": "Nashville, TN",
    "ticketUrl": "https://example.com/tickets"
  }
]
```

- **`id`**: Unique identifier (required)
- **`date`**: ISO 8601 format with timezone (required)
- **`venue`**: Venue name (required)
- **`city`**: City, State/Country (required)
- **`ticketUrl`**: Link to buy tickets (optional)

### Editing Merch

Edit `content/merch.json`:

```json
[
  {
    "id": "unique-id",
    "name": "Tour T-Shirt",
    "href": "https://store.example.com/tee",
    "price": "$25"
  }
]
```

- **`id`**: Unique identifier (required)
- **`name`**: Item name (required)
- **`href`**: Link to product page (required, must be valid URL)
- **`price`**: Display price (optional)

### Site Configuration

Edit `src/config/site.ts`:

```ts
export const site = {
  name: "Your Band Name",
  description: "Your tagline",
  contactEmail: "booking@example.com",
  socials: [
    { label: "Instagram", href: "https://instagram.com/yourband" },
    // Add or remove as needed
  ],
};
```

## Environment Variables

Copy `env.example` to `.env.local`:

```bash
cp env.example .env.local
```

Set your production URL:

```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

This is used for:
- Generating absolute URLs in metadata
- Open Graph images
- Sitemap generation

## Testing

Tests use **Vitest** + **React Testing Library**:

```bash
# Run all tests once
npm test

# Watch mode (for development)
npm run test:watch
```

Add tests in `src/__tests__/` with the `.test.tsx` extension.

## Linting & Formatting

The project uses ESLint 9 (flat config) with Next.js rules and Prettier for formatting:

```bash
# Check for linting issues
npm run lint

# Check TypeScript types
npm run typecheck

# Format code
npm run format
```

All checks run automatically via pre-commit hooks if you have them configured.

## Deployment

### Vercel (Recommended)

1. Import repository in Vercel
2. Set environment variable: `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`
3. Deploy

Vercel automatically detects Next.js and optimizes the build.

### Docker

Build and run the production image:

```bash
# Build
docker build -t bandland .

# Run
docker run --rm -p 3000:3000 \
  --env NEXT_PUBLIC_SITE_URL=https://yourdomain.com \
  bandland
```

The Dockerfile uses Next.js standalone output for minimal image size.

### Other Platforms

The project works on any platform supporting Node.js 22:

- **Netlify**: Auto-detected
- **Cloudflare Pages**: Use Next.js adapter
- **Railway/Render**: Deploy from GitHub

## Design System

All design tokens (colors, spacing, typography) are defined in:
- `src/app/globals.css` – CSS custom properties
- `AGENTS.md` – Complete visual & UX guidelines

The project follows a **dark, monochrome aesthetic** with high contrast and generous whitespace. See `AGENTS.md` for the full design philosophy.

## License

MIT – See `LICENSE` file.
