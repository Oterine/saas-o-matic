import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { CurrencyProvider } from './features/currency/CurrencyProvider';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('No se encuentra el elemento #root en index.html');

createRoot(container).render(
  <StrictMode>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </StrictMode>,
);
