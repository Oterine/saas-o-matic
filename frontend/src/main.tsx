// La base va primero para que las hojas de cada componente puedan sobrescribirla.
import './index.css';
import './components/controls.css';
import './components/buttons.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { CurrencyProvider } from './features/currency/CurrencyProvider';

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
