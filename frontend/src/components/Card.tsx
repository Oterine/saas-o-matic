import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  /** Elemento HTML que envuelve la tarjeta (`li` dentro de listas). */
  as?: 'article' | 'section' | 'li' | 'div';
  className?: string;
  /** Id del encabezado que da nombre a la tarjeta: una `section` con nombre es una región navegable. */
  labelledBy?: string;
}

export function Card({ children, as: Element = 'div', className = '', labelledBy }: CardProps) {
  return (
    <Element className={`card ${className}`.trim()} aria-labelledby={labelledBy}>
      {children}
    </Element>
  );
}
