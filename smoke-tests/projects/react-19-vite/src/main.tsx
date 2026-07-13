// smoke-tests/projects/react-19-vite/src/main.tsx
import {createRoot} from 'react-dom/client';
import {App} from './App';
import {createBrowserMockStripe} from './lib/stripeMocks.browser';

const stripe =
  typeof window !== 'undefined' && (window as any).__SMOKE_MOCK_STRIPE__
    ? createBrowserMockStripe()
    : null;

createRoot(document.getElementById('root')!).render(<App stripe={stripe} />);
