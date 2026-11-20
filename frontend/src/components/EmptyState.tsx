import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  /** Explicación o acción sugerida (por ejemplo, un enlace para crear el primer elemento). */
  children?: ReactNode;
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="state state--empty">
      <p className="state-title">{title}</p>
      {children}
    </div>
  );
}
