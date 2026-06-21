import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MoviesPage } from './pages/MoviesPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { CinemasPage } from './pages/CinemasPage';
import { CinemaDetailPage } from './pages/CinemaDetailPage';
import { ShowtimesPage } from './pages/ShowtimesPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ShowtimesPage />} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="movies/:movieId" element={<MovieDetailPage />} />
          <Route path="cinemas" element={<CinemasPage />} />
          <Route path="cinemas/:cinemaId" element={<CinemaDetailPage />} />
          <Route path="showtimes" element={<ShowtimesPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
