import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="empty-state" role="alert">
      <p className="empty-state__title">Seite nicht gefunden</p>
      <p className="empty-state__hint">
        Die angeforderte Seite existiert nicht.
      </p>
      <div className="empty-state__actions">
        <Link to="/" className="btn btn--primary">
          Zurück zu den Vorstellungen
        </Link>
      </div>
    </div>
  );
}
