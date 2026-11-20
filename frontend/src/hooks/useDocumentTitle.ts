import { useEffect } from 'react';

const APP_NAME = 'SaaS-O-Matic';

/** Título de la pestaña por página: ayuda a orientarse con lector de pantalla y con varias pestañas. */
export function useDocumentTitle(pageTitle: string): void {
  useEffect(() => {
    document.title = `${pageTitle} · ${APP_NAME}`;
  }, [pageTitle]);
}
