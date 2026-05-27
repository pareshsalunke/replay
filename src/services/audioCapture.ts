/**
 * Microphone capture pipeline.
 *
 * Plain module (no React) holding the imperative audio graph as a singleton —
 * only one recording runs at a time. `getUserMedia` → `AudioContext` +
 * `AnalyserNode` (for the waveform) → `MediaRecorder` (Opus/WebM chunks).
 */

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;

/**
 * Request the microphone and build the audio graph.
 * Returns the MediaRecorder (not yet started — the Deepgram connection
 * starts it once the socket is open). Throws if mic access is denied.
 */
export async function startAudioCapture(): Promise<MediaRecorder> {
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) throw new Error('Web Audio API is not supported in this browser');
  audioContext = new Ctx();

  // Resume in case the context starts suspended (autoplay policy).
  if (audioContext.state === 'suspended') void audioContext.resume();

  const source = audioContext.createMediaStreamSource(mediaStream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 64;
  source.connect(analyser);

  mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm;codecs=opus' });
  return mediaRecorder;
}

/** Tear down the audio graph. Idempotent — safe to call when already stopped. */
export function stopAudioCapture(): void {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop();
    } catch {
      /* recorder already stopped */
    }
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
  }
  if (audioContext && audioContext.state !== 'closed') {
    void audioContext.close();
  }
  mediaRecorder = null;
  mediaStream = null;
  analyser = null;
  audioContext = null;
}

/** The current AnalyserNode, for the waveform meter — null when not recording. */
export function getAnalyser(): AnalyserNode | null {
  return analyser;
}
