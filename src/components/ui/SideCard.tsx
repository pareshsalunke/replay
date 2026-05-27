import type { ReactNode } from 'react';
import styles from './SideCard.module.css';

interface SideCardProps {
  children: ReactNode;
  className?: string;
}

/** Sidebar info card — ports `.sj-side-card`. */
export function SideCard({ children, className }: SideCardProps) {
  return <div className={[styles.sideCard, className].filter(Boolean).join(' ')}>{children}</div>;
}

/** Uppercase section label inside a SideCard. */
export function SideCardLabel({ children }: { children: ReactNode }) {
  return <div className={styles.label}>{children}</div>;
}
