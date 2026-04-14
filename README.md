# Setlist - Song Diary

A personal music profile app. Track your listening diary, concerts attended, and artists on your wishlist.

## Quick Start

```bash
npm install
npm run seed    # Seeds the database from bands.json (user: logge)
npm run dev     # Start dev server at http://localhost:3000
```

Then open [http://localhost:3000/logge](http://localhost:3000/logge).

## Features

- **Profile pages** at `/<username>` with tabbed navigation
- **Overview** tab: stats, top genres, recent diary entries
- **Song Diary**: log what you're listening to with mood tags, notes, and audio previews
- **Live**: concerts and festivals attended (imported from bands.json)
- **Wishlist**: artists you want to see live (imported from bands.json)
- **Reactions**: emoji reactions on diary entries (anonymous)
- **Audio previews**: play 30s Deezer previews inline

## Stack

- **Next.js 15** (App Router, server components)
- **SQLite** via better-sqlite3
- **Tailwind CSS v4**
- **TypeScript**

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/diary` | Create diary entry |
| POST | `/api/diary/:id/reactions` | Add emoji reaction |

## Deploy

Uses standalone Next.js output with Docker:

```bash
docker build -t setlist .
docker run -p 3000:3000 setlist
```

## Seed Data

Run `npm run seed` to populate the database from `bands.json`. This creates user `logge` with:
- 39 wishlist artists
- 40 live events
- 20 diary entries with sample reactions
