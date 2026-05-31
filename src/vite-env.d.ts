/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEEPGRAM_KEY?: string;
  readonly VITE_GEMINI_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

// Safari prefixes AudioContext.
interface Window {
  webkitAudioContext?: typeof AudioContext;
}
