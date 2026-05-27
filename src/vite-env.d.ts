/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

// Safari prefixes AudioContext.
interface Window {
  webkitAudioContext?: typeof AudioContext;
}
