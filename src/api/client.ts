import {
  ApiError,
  NetworkError,
  NotFoundError,
  ServerError,
  TimeoutError,
} from './errors';

export const API_BASE_URL =
  import.meta.env.VITE_KINOVA_API_URL || 'http://localhost:8000/api/v1';

const DEFAULT_TIMEOUT_MS = 10000;
const RETRY_DELAYS_MS = [1000, 2000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNetworkError(error: unknown): error is TypeError {
  return error instanceof TypeError;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function classifyHttpError(status: number, detail: string): ApiError {
  if (status === 404) return new NotFoundError(detail);
  if (status >= 500) return new ServerError(detail);
  return new ApiError(status, detail);
}

export async function kinovaFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = (options.method || 'GET').toUpperCase();
  const shouldRetry = method === 'GET';
  const maxAttempts = shouldRetry ? RETRY_DELAYS_MS.length + 1 : 1;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        ...options,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        let detail = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorBody = (await response.json()) as {
            detail?: string;
            message?: string;
          };
          detail = errorBody.detail || errorBody.message || detail;
        } catch {
          // Fall back to the default status-based message.
        }
        throw classifyHttpError(response.status, detail);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error;

      // Non-retryable errors: propagate immediately.
      if (
        error instanceof TimeoutError ||
        error instanceof NotFoundError ||
        (error instanceof ApiError && !(error instanceof ServerError))
      ) {
        throw error;
      }

      const canRetry =
        shouldRetry &&
        attempt < RETRY_DELAYS_MS.length &&
        (isNetworkError(error) || error instanceof ServerError);

      if (canRetry) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }

      if (isNetworkError(error)) {
        throw new NetworkError();
      }

      throw error;
    }
  }

  // Should only be reached if the loop exits without throwing.
  if (isNetworkError(lastError)) {
    throw new NetworkError();
  }
  throw lastError;
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
