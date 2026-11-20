import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  /** Elemento HTML que envuelve la tarjeta (`li` dentro de listas). */
  as?: 'article' | 'section' | 'li' | 'div';
  className?: string;
}

export function Card({ children, as: Element = 'div', className = '' }: CardProps) {
  return <Element className={`card ${className}`.trim()}>{children}</Element>;
}
