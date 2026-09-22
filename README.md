# tune-link-web

An AI-powered playlist generator. Describe a mood, moment, or vibe and get a curated 15-track playlist — enriched with iTunes metadata, shareable via a short URL, and playable on your preferred platform.

## Features

- **AI playlist generation** — uses GPT-4o or Gemini to generate playlists from a text prompt
- **iTunes enrichment** — each track is matched against the iTunes catalog for artwork, preview URLs, and metadata
- **Multi-platform links** — launch tracks directly in Spotify, Apple Music, or YouTube
- **Shareable playlists** — every generated playlist gets a short URL (`/playlist/:shortcode`)
- **Drag-to-reorder** — reorder tracks in the playlist with drag-and-drop
- **Auth** — user accounts with OAuth (Google, GitHub) or email/password

## Stack

| Layer    | Tech                              |
|----------|-----------------------------------|
| Frontend | React 19 + TanStack Router/Start  |
| AI       | Vercel AI SDK (OpenAI / Google)   |
| Styling  | Tailwind CSS + shadcn/ui          |
| Database | PostgreSQL via Drizzle ORM        |
| Auth     | better-auth                       |
| Deploy   | Fly.io + Docker                   |

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL
- OpenAI API key (and/or Google AI API key)

## Setup

```bash
pnpm install

cp .env.example .env
# Fill in DATABASE_URL, OPENAI_API_KEY, and auth provider credentials

pnpm db:push

pnpm dev
```

## Environment variables

| Variable               | Description                            |
|------------------------|----------------------------------------|
| `DATABASE_URL`         | PostgreSQL connection string           |
| `OPENAI_API_KEY`       | OpenAI API key (for GPT-4o)            |
| `GOOGLE_AI_API_KEY`    | Google AI API key (for Gemini)         |
| `BETTER_AUTH_SECRET`   | Random secret for session signing      |

## Building

```bash
pnpm build
pnpm start
```