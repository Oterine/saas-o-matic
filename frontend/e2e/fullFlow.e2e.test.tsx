/**
 * Prueba de punta a punta: la app React completa (jsdom) contra el backend real compilado, por HTTP.
 * Se lanza con `npm run test:e2e` desde la raíz, que compila el backend antes.
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { renderApp } from '../src/testUtils';

const PORT = 3199;
const BACKEND_URL = `http://localhost:${PORT}`;
const BACKEND_DIR = join(process.cwd(), '..', 'backend');
const DB_PATH = join(tmpdir(), `saas-o-matic-e2e-${process.pid}.db`);

let server: ChildProcess;

async function waitForBackend(realFetch: typeof fetch): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await realFetch(`${BACKEND_URL}/countries`).then((r) => r.ok, () => false)) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`El backend no respondió en ${BACKEND_URL}`);
}

beforeAll(async () => {
  if (!existsSync(join(BACKEND_DIR, 'dist', 'server.js'))) {
    throw new Error('Falta backend/dist: ejecuta `npm run test:e2e` desde la raíz (compila el backend).');
  }
  server = spawn(process.execPath, ['dist/server.js'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: String(PORT), DB_PATH },
    stdio: 'ignore',
  });

  const realFetch = globalThis.fetch;
  await waitForBackend(realFetch);
  // Lo que hace el proxy de Vite: quitar /api y reenviar al backend.
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    realFetch(`${BACKEND_URL}${String(input).replace(/^\/api/, '')}`, init),
  );
});

afterAll(async () => {
  vi.unstubAllGlobals();
  if (server.exitCode === null) {
    server.kill();
    await once(server, 'exit'); // En Windows, el fichero sigue bloqueado hasta que el proceso termina.
  }
  for (const suffix of ['', '-wal', '-shm']) rmSync(DB_PATH + suffix, { force: true, maxRetries: 5, retryDelay: 200 });
});

const plain = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ');
const total = () => plain(screen.queryByText('Total mensual')?.nextElementSibling?.textContent);

it('alta → detalle → simulador → guardar → historial → búsqueda', async () => {
  const user = userEvent.setup();
  renderApp('/');

  // Listado vacío y paso al alta.
  expect(await screen.findByText('Todavía no hay clientes')).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Nuevo cliente' }));
  await waitFor(() => expect(screen.getByLabelText('País')).toHaveValue('ES'));

  // DNI con letra incorrecta: el mensaje viene del algoritmo real del backend.
  await user.type(screen.getByLabelText('Nombre de la empresa'), 'Álvarez Ibarra S.L.');
  await user.type(screen.getByLabelText('Identificador fiscal'), '12345678A');
  await user.type(screen.getByLabelText('Email de contacto'), 'info@alvarez.es');
  await user.click(screen.getByRole('button', { name: 'Registrar cliente' }));
  expect(await screen.findByText('La letra de control del DNI no es correcta')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByLabelText('Identificador fiscal')).toHaveFocus());

  // CIF válido escrito con guion y punto: se guarda normalizado y se navega al detalle.
  await user.clear(screen.getByLabelText('Identificador fiscal'));
  await user.type(screen.getByLabelText('Identificador fiscal'), 'b-1234.5674');
  await user.click(screen.getByRole('button', { name: 'Registrar cliente' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Álvarez Ibarra S.L.' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Datos del cliente' })).toHaveTextContent('B12345674');
  expect(screen.getByRole('main')).toHaveFocus();

  // Vista previa real: 10 usuarios en ES → 100 € + 21 %. Deslizador a 51 → 425 € + 21 %.
  await waitFor(() => expect(total()).toBe('121,00 €'), { timeout: 3000 });
  fireEvent.change(screen.getByRole('slider', { name: 'Usuarios activos (deslizador)' }), { target: { value: '51' } });
  await waitFor(() => expect(total()).toBe('514,25 €'), { timeout: 3000 });

  // Usuarios vacíos → mensaje real del backend junto al campo.
  const number = screen.getByRole('spinbutton', { name: 'Usuarios activos (número)' });
  await user.clear(number);
  await waitFor(() => expect(number).toHaveAccessibleDescription(/número entero mayor o igual que 0/), { timeout: 3000 });
  await user.type(number, '51');
  await waitFor(() => expect(total()).toBe('514,25 €'), { timeout: 3000 });

  // Almacenamiento con 3 decimales → 422 real en su campo; con 2 decimales se guarda.
  const storage = screen.getByLabelText('Almacenamiento (GB)');
  await user.clear(storage);
  await user.type(storage, '1.234');
  await user.click(screen.getByRole('button', { name: 'Guardar simulación' }));
  expect(await screen.findByText('El almacenamiento admite como máximo 2 decimales')).toBeInTheDocument();
  await user.clear(storage);
  await user.type(storage, '0.29');
  await user.click(screen.getByRole('button', { name: 'Guardar simulación' }));
  expect(await screen.findByText('Simulación guardada en el historial.')).toBeInTheDocument();

  // El historial se refresca sin recargar con la simulación guardada.
  const history = screen.getByRole('region', { name: 'Historial de simulaciones' });
  const items = await within(history).findAllByRole('listitem');
  expect(items).toHaveLength(1);
  expect(plain(items[0]!.textContent)).toContain('514,25 €');
  expect(plain(items[0]!.textContent)).toContain('0,29 GB');

  // Volver y buscar sin tildes: el backend pliega mayúsculas y tildes.
  await user.click(screen.getByRole('link', { name: 'Volver a clientes' }));
  await user.type(await screen.findByLabelText('Buscar por empresa o identificador fiscal'), 'ALVAREZ');
  await waitFor(() => expect(screen.getByText('1 cliente')).toBeInTheDocument());
  expect(screen.getByRole('link', { name: 'Álvarez Ibarra S.L.' })).toHaveAttribute('href', '/customers/1');
});
