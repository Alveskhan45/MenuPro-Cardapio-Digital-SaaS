import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';
import { installDemoApi } from '@/demo/api-mock';

import './index.css';

/* No modo demo a API e respondida em memoria: sem backend nao ha quem atenda
   /api/*. Precisa rodar antes do primeiro fetch, entao vem antes do render. */
if (import.meta.env.VITE_DEMO_MODE === 'true') {
  installDemoApi();
}

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
