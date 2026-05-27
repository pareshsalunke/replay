import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Card width in px (default 540). */
  width?: number;
}

/** Centered modal with a backdrop — ports `.sj-modal` / `.sj-modal-card`. */
export function Modal({ open, onClose, children, width }: ModalProps) {
  if (!open) return null;
  return createPortal(
    <div className={styles.modal} onClick={onClose}>
      <div
        className={styles.card}
        style={width ? { width: `min(${width}px, 92vw)` } : undefined}
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
