import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Drawer.module.css';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Right-side slide-in drawer — ports `.sj-overlay` / `.sj-drawer`. */
export function Drawer({ open, onClose, children }: DrawerProps) {
  if (!open) return null;
  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
