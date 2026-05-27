import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  /** Optional leading icon. */
  icon?: IconName;
  children?: ReactNode;
}

/** Primary action button — ports the prototype's `.sj-btn` family. */
export function Button({
  variant = 'default',
  icon,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const cls = [
    styles.btn,
    variant === 'primary' && styles.primary,
    variant === 'danger' && styles.danger,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    // eslint-disable-next-line react/button-has-type
    <button type={type} className={cls} {...rest}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}
