import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useExchangeRates } from './useExchangeRates';

const rates = { EUR: 1, USD: 1.1 };

describe('useExchangeRates', () => {
  it('pasa de cargando a listo con los tipos', async () => {
    const loader = vi.fn().mockResolvedValue(rates);
    const { result } = renderHook(() => useExchangeRates(loader));

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', rates }));
  });

  it('pasa a error si falla y se recupera al reintentar', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('caída')).mockResolvedValueOnce(rates);
    const { result } = renderHook(() => useExchangeRates(loader));

    await waitFor(() => expect(result.current.state).toEqual({ status: 'error' }));

    act(() => result.current.retry());
    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', rates }));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('cancela la carga al desmontar', () => {
    let received: AbortSignal | undefined;
    const loader = vi.fn((signal: AbortSignal) => {
      received = signal;
      return new Promise<typeof rates>(() => {});
    });
    const { unmount } = renderHook(() => useExchangeRates(loader));

    unmount();
    expect(received?.aborted).toBe(true);
  });
});
