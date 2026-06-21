export interface UrlDetail {
  url: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ImageAsset {
  url?: string;
  alt?: string | null;
}

export interface City {
  id: string;
  name: string;
  urlSlug: string;
  coordinates: Coordinates;
  detailUrl: UrlDetail;
}

export interface CitySummary {
  id: string;
  name: string;
  urlSlug: string;
}

export interface Cinema {
  id: string;
  name: string;
  street?: string;
  city?: CitySummary;
  distance?: number;
  coordinates?: Coordinates;
  postcode?: string;
  phonenumber?: string;
  detailUrl?: UrlDetail;
  thumbnail?: ImageAsset;
  heroImage?: ImageAsset;
  urlSlug: string;
  isDriveInCinema: boolean;
  isOpenAirCinema: boolean;
  isStationaryCinema: boolean;
}

export interface Genre {
  id?: string;
  name: string;
  urlSlug?: string;
}

export interface Person {
  id?: string;
  name?: string;
}

export interface Movie {
  id: string;
  title: string;
  description?: string;
  additionalDescription?: string;
  duration?: number;
  genres: Genre[];
  directors: Person[];
  actors: Person[];
  productionYear?: string;
  thumb?: ImageAsset;
  heroImage?: ImageAsset;
  detailUrl?: UrlDetail;
  urlSlug?: string;
  imdbRating?: number;
  imdbVotes?: number;
}

export interface ShowFlag {
  name: string;
  code?: string;
  category?: string;
}

export interface ShowTime {
  formatted?: string;
  timestamp?: number;
}

export interface Auditorium {
  id?: string;
  name?: string;
  seatCount?: number;
}

export interface Show {
  id: string;
  name: string;
  beginning?: ShowTime;
  admission?: ShowTime;
  duration?: string;
  flags: ShowFlag[];
  detailUrl?: UrlDetail;
  isSoldOut?: boolean;
  movie?: Movie;
  auditorium?: Auditorium;
}

export interface ApiErrorDetail {
  detail?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}
