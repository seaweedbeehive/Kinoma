import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';

function validateEnv() {
  const apiUrl = import.meta.env.VITE_KINOVA_API_URL;
  if (!apiUrl) {
    console.error(
      'VITE_KINOVA_API_URL is not set. Please check your .env file.'
    );
    return;
  }

  try {
    new URL(apiUrl);
  } catch {
    console.error(`VITE_KINOVA_API_URL is not a valid URL: ${apiUrl}`);
  }
}

validateEnv();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
