import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { CurrencyProvider } from './features/currency/CurrencyProvider';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('No se encuentra el elemento #root en index.html');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </BrowserRouter>
  </StrictMode>,
);
