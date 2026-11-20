import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  status: 'loading' | 'success' | 'error';
  /** Último dato recibido. Se conserva mientras se recarga, para no vaciar la pantalla en cada búsqueda. */
  data: T | undefined;
  error: unknown;
}

/**
 * Carga datos con estados de carga y error, reintento manual y cancelación.
 * Solo se recarga cuando cambia `key` (p. ej. el texto buscado) o al reintentar; `load` puede ser
 * una función inline, porque se lee su última versión desde una ref y no provoca recargas.
 * Al cambiar `key`, la petición anterior se cancela y su respuesta se descarta.
 */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, key: unknown = null) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading', data: undefined, error: undefined });
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);

  // Se declara antes que el efecto de carga, así que se ejecuta primero y este ve la última `load`.
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ status: 'loading', data: previous.data, error: undefined }));

    loadRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data, error: undefined });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState((previous) => ({ status: 'error', data: previous.data, error }));
      },
    );

    return () => controller.abort();
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
