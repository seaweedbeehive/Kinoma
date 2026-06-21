export class ApiError extends Error {
  statusCode: number;
  detail: string;

  constructor(statusCode: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

export class TimeoutError extends ApiError {
  constructor(detail = 'Die Anfrage hat zu lange gedauert.') {
    super(408, detail);
    this.name = 'TimeoutError';
  }
}

export class NotFoundError extends ApiError {
  constructor(detail = 'Keine Ergebnisse gefunden.') {
    super(404, detail);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends ApiError {
  constructor(detail = 'Server-Fehler.') {
    super(500, detail);
    this.name = 'ServerError';
  }
}

export class NetworkError extends ApiError {
  constructor(
    detail = 'Keine Verbindung zum Kinova-Backend. Bitte stelle sicher, dass es auf localhost:8001 läuht.'
  ) {
    super(0, detail);
    this.name = 'NetworkError';
  }
}
