# Habit Tracker PWA

A personal habit tracking Progressive Web App built with Next.js, Prisma, and NextAuth.

## Features

- **Add / Edit / Delete Habits** — color-coded with icons and frequency
- **Daily Check-in** — toggle habits done with a satisfying progress ring
- **Streaks** — per-habit streak tracking with consecutive-day logic
- **Trends & Charts** — 30-day completion rate (area chart), last 7 days (bar chart), per-habit stats
- **Overall Summary** — completion rate, best streak, 7-day average
- **GitHub Auth** — single-user authentication restricted to your GitHub username
- **PWA** — installable on mobile and desktop with offline support

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL + Prisma 7 |
| Auth | NextAuth v5 (GitHub OAuth) |
| Charts | Recharts |
| Styling | Tailwind CSS v4 |
| PWA | Web App Manifest + Service Worker |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/habit_tracker"

# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret"

# Your app URL
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth App (create at github.com/settings/developers)
# Callback URL: http://localhost:3000/api/auth/callback/github
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# YOUR GitHub username — only this account can log in
ALLOWED_GITHUB_USERNAME="your-username"
```

### 3. Set up the database

```bash
# Push schema to your database (quick setup)
npm run db:push

# Or create a proper migration
npm run db:migrate
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set **Authorization callback URL** to:
   - Dev: `http://localhost:3000/api/auth/callback/github`
   - Prod: `https://yourdomain.com/api/auth/callback/github`
4. Copy the **Client ID** and **Client Secret** to your `.env`
5. Set `ALLOWED_GITHUB_USERNAME` to your GitHub username

## Deployment

Standard Next.js app — deploy to Vercel, Railway, Fly.io, etc. Set all environment variables in your hosting platform.

## PWA Icons

Replace placeholder icons in `public/icons/` with actual app icons (192×192 and 512×512 PNG). Generate them at [realfavicongenerator.net](https://realfavicongenerator.net/).
