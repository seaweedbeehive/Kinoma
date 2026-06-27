# Kinoma

Berlin cinema showtimes aggregator with advanced subtitle and language filtering.

Find every movie showing in every Berlin cinema, filter by subtitle language (OV, OmU, OmeU), and discover your next cinema visit — all in one place.

## Features

- **Aggregated showtimes across all Berlin cinemas** — see everything playing today, tomorrow, or any upcoming day
- **Advanced subtitle & language filtering** — filter by OV (Original Version), OmU (German subtitles), OmeU (English subtitles), any subtitles, English subtitles, or German dubbed
- **Movie-first discovery** — browse all films playing in Berlin, then find which cinema has them
- **Cinema-first discovery** — browse Berlin cinemas and see what's playing at each one
- **Favorites** — save movies and cinemas to your personal watchlist (localStorage)
- **Real-time data** — live showtime data from the [Kinova API](https://github.com/5aeidi/kinova), a REST wrapper around Kinoheld's GraphQL API
- **Responsive dark theme** — desktop sidebar layout, mobile slide-out drawer, date scroller

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Data Fetching**: TanStack Query (React Query) v5 — caching, parallel requests, deduping
- **Routing**: React Router v7
- **Styling**: Custom CSS with design tokens, dark theme, responsive breakpoints
- **API**: [Kinova](https://github.com/5aeidi/kinova) — FastAPI wrapper around Kinoheld GraphQL

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- [Kinova](https://github.com/5aeidi/kinova) running locally (or your own instance)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/seaweedbeehive/Kinoma.git
cd Kinoma/kinoma
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
VITE_KINOVA_API_URL=http://localhost:8001/api/v1
```

Change the port if your Kinova instance runs on a different one.

#### Optional: TMDB API key for trending movies

To enable the **Beliebtheit (TMDB)** sort option on the Movies page, add a TMDB API key:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key
```

Get a free key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) (sign up → Account Settings → API → Request an API key). The app works without it; trending sort simply falls back to rating order when the key is absent.

#### Optional: TMDB + LLM for German film synopses

Film synopses on the Movie detail page are fetched from multiple sources in this priority order:

1. **TMDB German overview** — fetched directly from TMDB when `VITE_TMDB_API_KEY` is set and a German overview exists.
2. **TMDB English overview translated to German** — if no German overview is available, the English overview is translated using an LLM. Provide one of the following keys:
   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key
   # or
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
   ```
3. **TMDB English overview** — shown untranslated if no LLM key is configured.
4. **Kinova description** — the original `description` field from the Kinova API, used as a fallback when TMDB is unavailable or returns no match.

Results are cached by TanStack Query for 24 hours. The detail page shows a small source badge (e.g., "TMDB (DE)" or "TMDB + KI") next to the synopsis.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Start Kinova (for real-time data)

In a separate terminal:

```bash
git clone https://github.com/5aeidi/kinova.git
cd kinova
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Verify it's running:

```bash
curl http://localhost:8001/api/v1/health
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Project Structure

```
kinoma/
├── public/              # Static assets
├── src/
│   ├── api/             # API client, types, endpoints
│   ├── components/      # Reusable UI components
│   ├── hooks/           # TanStack Query hooks
│   ├── pages/           # Route-level page components
│   ├── utils/           # Helpers (flags, date formatting)
│   ├── App.tsx          # Root component with routing
│   └── main.tsx         # Entry point, QueryClient setup
├── .env                 # Environment variables (not committed)
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## API Reference

This frontend consumes the [Kinova API](https://github.com/5aeidi/kinova/blob/main/API.md):

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/health` | Health check |
| `GET /api/v1/cities` | List cities |
| `GET /api/v1/cinemas?location=Berlin` | List Berlin cinemas |
| `GET /api/v1/movies?location=Berlin&playing=NOW` | Movies currently playing |
| `GET /api/v1/shows?cinemaId=X&date=Y` | Showtimes for a cinema on a date |
| `GET /api/v1/genres` | Movie genres |

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Showtime data provided by [Kinoheld](https://www.kinoheld.de/) via [Kinova](https://github.com/5aeidi/kinova)
