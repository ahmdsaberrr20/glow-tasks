import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DataProvider } from './data';
import { App } from './App';
import './styles/theme.css';

// Ask the browser not to evict our IndexedDB data under storage pressure.
navigator.storage?.persist?.().catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </StrictMode>,
);
