import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState';
import { ErrorMessage } from './ErrorMessage';
import { Loading } from './Loading';

describe('componentes de estado', () => {
  it('Loading se anuncia como estado', () => {
    render(<Loading label="Cargando clientes…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando clientes…');
  });

  it('ErrorMessage se anuncia como alerta y reintenta', async () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="No se pudo cargar" onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('ErrorMessage sin onRetry no muestra el botón', () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('EmptyState muestra el título y la acción sugerida', () => {
    render(
      <EmptyState title="Todavía no hay clientes">
        <a href="/customers/new">Crear el primero</a>
      </EmptyState>,
    );
    expect(screen.getByText('Todavía no hay clientes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crear el primero' })).toBeInTheDocument();
  });
});
