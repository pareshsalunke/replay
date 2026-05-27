import styles from './Spinner.module.css';

/** Small inline loading spinner. */
export function Spinner() {
  return <span className={styles.spinner} aria-hidden="true" />;
}
