export interface TMDBMovie {
  id: number;
  title: string;
  popularity: number;
  vote_average?: number;
}

export interface TMDBTrendingResponse {
  results: TMDBMovie[];
}

export interface TMDBSearchResponse {
  results: TMDBMovie[];
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  overview?: string;
  original_language?: string;
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function titleKey(str: string): string {
  return normalize(str)
    .replace(/^(the|a|an|der|die|das|ein|eine|les|le|la|l')\s+/i, '')
    .replace(/[^a-z0-9]/g, '');
}

function getApiKey(): string | undefined {
  return import.meta.env.VITE_TMDB_API_KEY;
}

export function hasTmdbKey(): boolean {
  return Boolean(getApiKey());
}

export async function getTrendingMovies(): Promise<TMDBTrendingResponse> {
  const apiKey = getApiKey();

  if (!apiKey) {
    // Graceful fallback when no key is configured so the UI still works.
    return { results: [] };
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/trending/movie/week?api_key=${encodeURIComponent(apiKey)}&language=en-US`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<TMDBTrendingResponse>;
}

export async function searchMovie(title: string): Promise<TMDBSearchResponse> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return { results: [] };
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(
      title
    )}&language=en-US&page=1`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<TMDBSearchResponse>;
}

export async function getMovieDetails(
  movieId: number,
  language = 'de-DE'
): Promise<TMDBMovieDetails> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('TMDB API key is not configured');
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${encodeURIComponent(movieId)}?api_key=${encodeURIComponent(
      apiKey
    )}&language=${encodeURIComponent(language)}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<TMDBMovieDetails>;
}
