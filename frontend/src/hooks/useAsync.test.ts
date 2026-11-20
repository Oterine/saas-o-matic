import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAsync } from './useAsync';

/** Promesa que se resuelve a mano, para controlar el orden de las respuestas. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('useAsync', () => {
  it('pasa de loading a success con los datos', async () => {
    const { result } = renderHook(() => useAsync(async () => 'datos'));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current).toMatchObject({ status: 'success', data: 'datos' }));
  });

  it('una función inline no provoca recargas en cada render (sin bucle infinito)', async () => {
    const load = vi.fn(async () => 'datos');
    const { result, rerender } = renderHook(() => useAsync(() => load()));

    await waitFor(() => expect(result.current.status).toBe('success'));
    rerender();
    rerender();

    expect(load).toHaveBeenCalledOnce();
  });

  it('pasa a error y se recupera con retry', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('caída')).mockResolvedValueOnce('datos');
    const { result } = renderHook(() => useAsync(load));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toEqual(new Error('caída'));

    act(() => result.current.retry());
    await waitFor(() => expect(result.current).toMatchObject({ status: 'success', data: 'datos' }));
  });

  it('recarga al cambiar la clave y conserva los datos anteriores mientras tanto', async () => {
    const second = deferred<string>();
    const { result, rerender } = renderHook(
      ({ search }) => useAsync(async () => (search === 'a' ? 'primero' : second.promise), search),
      { initialProps: { search: 'a' } },
    );
    await waitFor(() => expect(result.current.data).toBe('primero'));

    rerender({ search: 'b' });
    expect(result.current).toMatchObject({ status: 'loading', data: 'primero' });

    await act(async () => second.resolve('segundo'));
    expect(result.current).toMatchObject({ status: 'success', data: 'segundo' });
  });

  it('descarta la respuesta de una clave anterior que llega tarde', async () => {
    const slow = deferred<string>();
    const fast = deferred<string>();
    const { result, rerender } = renderHook(
      ({ search }) => useAsync(() => (search === 'lenta' ? slow.promise : fast.promise), search),
      { initialProps: { search: 'lenta' } },
    );

    rerender({ search: 'rápida' });
    await act(async () => fast.resolve('nueva'));
    await act(async () => slow.resolve('vieja'));

    expect(result.current.data).toBe('nueva');
  });
});
