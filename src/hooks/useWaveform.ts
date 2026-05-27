import { useEffect, type RefObject } from 'react';
import { getAnalyser } from '@/services/audioCapture';

/**
 * Animate the waveform bars from live audio.
 *
 * Runs a `requestAnimationFrame` loop only while `active`, reading the
 * AnalyserNode's frequency data and writing bar heights directly to the DOM —
 * no React state, so the ~60fps update causes zero re-renders.
 */
export function useWaveform(barsRef: RefObject<(HTMLElement | null)[]>, active: boolean) {
  useEffect(() => {
    if (!active) return;

    let rafId = 0;
    const tick = () => {
      const analyser = getAnalyser();
      const bars = barsRef.current;
      if (analyser && bars) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        for (let i = 0; i < bars.length; i++) {
          const bar = bars[i];
          if (!bar) continue;
          const idx = Math.floor((i * data.length) / bars.length);
          const h = Math.max(4, (data[idx] / 255) * 36);
          bar.style.height = `${h}px`;
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [active, barsRef]);
}
