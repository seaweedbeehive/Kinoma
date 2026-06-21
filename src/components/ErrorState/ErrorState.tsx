import type { ReactNode } from 'react';
import {
  ApiError,
  NetworkError,
  NotFoundError,
  ServerError,
  TimeoutError,
} from '../../api/errors';

interface ErrorStateProps {
  title?: string;
  message?: string;
  detail?: string;
  error?: unknown;
  onRetry?: () => void;
  children?: ReactNode;
}

function resolveErrorContent(error: unknown): {
  title: string;
  message: string;
  detail?: string;
} {
  if (error instanceof TimeoutError) {
    return {
      title: 'Zeitüberschreitung',
      message:
        'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.',
    };
  }

  if (error instanceof NotFoundError) {
    return {
      title: 'Nicht gefunden',
      message: 'Keine Ergebnisse gefunden.',
    };
  }

  if (error instanceof ServerError) {
    return {
      title: 'Server-Fehler',
      message: 'Server-Fehler. Bitte später erneut versuchen.',
    };
  }

  if (error instanceof NetworkError) {
    return {
      title: 'Verbindungsfehler',
      message:
        'Keine Verbindung zum Kinova-Backend. Bitte stelle sicher, dass es auf localhost:8001 läuht.',
    };
  }

  if (error instanceof ApiError) {
    return {
      title: 'Fehler beim Laden',
      message: error.message,
      detail: error.detail,
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Fehler beim Laden',
      message: error.message,
    };
  }

  return {
    title: 'Fehler beim Laden',
    message: 'Ein unerwarteter Fehler ist aufgetreten.',
  };
}

export function ErrorState({
  title,
  message,
  detail,
  error,
  onRetry,
  children,
}: ErrorStateProps) {
  const resolved = error ? resolveErrorContent(error) : null;
  const displayTitle = title ?? resolved?.title ?? 'Fehler beim Laden';
  const displayMessage = message ?? resolved?.message ?? '';
  const displayDetail = detail ?? resolved?.detail;

  return (
    <div className="error-state" role="alert">
      <p className="error-state__title">{displayTitle}</p>
      <p className="error-state__message">{displayMessage}</p>
      {displayDetail && <p className="error-state__detail">{displayDetail}</p>}
      {onRetry && (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Erneut versuchen
        </button>
      )}
      {children}
    </div>
  );
}
