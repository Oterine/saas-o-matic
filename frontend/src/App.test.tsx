import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from './testUtils';

// Las páginas piden datos al montarse; aquí solo interesan el layout y las rutas.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App: layout y rutas', () => {
  it('muestra la marca, el selector de divisa y el enlace de salto al contenido', () => {
    renderApp('/');

    expect(screen.getByRole('link', { name: 'SaaS-O-Matic' })).toHaveAttribute('href', '/');
    expect(screen.getByLabelText('Divisa')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#contenido');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido');
  });

  it.each([
    ['/', 'Clientes'],
    ['/customers/new', 'Nuevo cliente'],
    ['/customers/7', 'Detalle del cliente'],
  ])('%s muestra la página "%s" y su título de pestaña', (path, title) => {
    renderApp(path);

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(document.title).toBe(`${title} · SaaS-O-Matic`);
  });

  it('una ruta desconocida muestra la página 404 con enlace al listado', async () => {
    const user = userEvent.setup();
    renderApp('/no-existe');

    expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Volver al listado de clientes' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Clientes' })).toBeInTheDocument();
  });
});
