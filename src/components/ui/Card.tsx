import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  /** When set, renders a card header with this uppercase title. */
  title?: string;
  /** Content rendered on the right side of the header. */
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Bordered container with an optional header — ports `.sj-card`. */
export function Card({ title, headerRight, children, className }: CardProps) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      {title !== undefined && (
        <div className={styles.head}>
          <h3>{title}</h3>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}
