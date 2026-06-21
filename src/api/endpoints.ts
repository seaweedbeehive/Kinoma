import { buildQueryString, kinovaFetch } from './client';
import {
  ApiError,
  NetworkError,
  NotFoundError,
  ServerError,
  TimeoutError,
} from './errors';
import type {
  Cinema,
  City,
  Genre,
  Movie,
  Show,
} from './types';

export { ApiError, NetworkError, NotFoundError, ServerError, TimeoutError };

interface HealthResponse {
  status: string;
}

export function getHealth(): Promise<HealthResponse> {
  return kinovaFetch<HealthResponse>('/health');
}

export function getCities(
  search?: string,
  limit?: number
): Promise<City[]> {
  const query = buildQueryString({ search, limit });
  return kinovaFetch<City[]>(`/cities${query}`);
}

export function getCityByMe(): Promise<City> {
  return kinovaFetch<City>('/cities/me');
}

interface GetCinemasParams {
  search?: string;
  location?: string;
  distance?: number;
  limit?: number;
  onlyBookable?: boolean;
  isOpenAir?: boolean;
  isDriveIn?: boolean;
}

export function getCinemas(params: GetCinemasParams = {}): Promise<Cinema[]> {
  const query = buildQueryString({
    search: params.search,
    location: params.location,
    distance: params.distance,
    limit: params.limit,
    onlyBookable: params.onlyBookable,
    isOpenAir: params.isOpenAir,
    isDriveIn: params.isDriveIn,
  });
  return kinovaFetch<Cinema[]>(`/cinemas${query}`);
}

export function getCinema(cinemaId: string): Promise<Cinema> {
  return kinovaFetch<Cinema>(`/cinemas/${encodeURIComponent(cinemaId)}`);
}

interface GetMoviesParams {
  search?: string;
  location?: string;
  distance?: number;
  limit?: number;
  playing?: 'NOW' | 'FUTURE' | 'UPCOMING';
}

export function getMovies(params: GetMoviesParams = {}): Promise<Movie[]> {
  const query = buildQueryString({
    search: params.search,
    location: params.location,
    distance: params.distance,
    limit: params.limit,
    playing: params.playing,
  });
  return kinovaFetch<Movie[]>(`/movies${query}`);
}

export function getMovie(movieId: string): Promise<Movie> {
  return kinovaFetch<Movie>(`/movies/${encodeURIComponent(movieId)}`);
}

interface GetShowsParams {
  cinemaId: string;
  date?: string;
  days?: number;
  movieId?: string;
}

export function getShows(params: GetShowsParams): Promise<Show[]> {
  const query = buildQueryString({
    cinemaId: params.cinemaId,
    date: params.date,
    days: params.days,
    movieId: params.movieId,
  });
  return kinovaFetch<Show[]>(`/shows${query}`);
}

export function getShow(showId: string): Promise<Show> {
  return kinovaFetch<Show>(`/shows/${encodeURIComponent(showId)}`);
}

export function getGenres(): Promise<Genre[]> {
  return kinovaFetch<Genre[]>('/genres');
}
