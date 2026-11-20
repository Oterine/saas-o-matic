import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('muestra el nombre de la aplicación como encabezado principal', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'SaaS-O-Matic' })).toBeInTheDocument();
  });
});
