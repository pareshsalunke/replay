import type { MicStatus } from '@/types';

/** Deepgram live-transcription endpoint (German, Nova-3, interim results). */
const DEEPGRAM_URL =
  'wss://api.deepgram.com/v1/listen' +
  '?language=de&model=nova-3&punctuate=true&interim_results=true' +
  '&endpointing=400&utterance_end_ms=1000';

export interface DeepgramTranscript {
  text: string;
  isFinal: boolean;
}

export interface DeepgramConnectionOptions {
  apiKey: string;
  onTranscript: (t: DeepgramTranscript) => void;
  onStatus: (status: MicStatus) => void;
}

export interface DeepgramConnection {
  /** Open the socket; once connected, stream `recorder` output to Deepgram. */
  connect: (recorder: MediaRecorder) => void;
  /** Close the socket. */
  close: () => void;
}

/** Shape of the inbound Deepgram transcription message we care about. */
interface DeepgramMessage {
  is_final?: boolean;
  channel?: { alternatives?: Array<{ transcript?: string }> };
}

/**
 * Create a Deepgram live-transcription WebSocket connection.
 *
 * Plain object (no React) so it can be unit-tested with a mock WebSocket.
 */
export function createDeepgramConnection(opts: DeepgramConnectionOptions): DeepgramConnection {
  const { apiKey, onTranscript, onStatus } = opts;
  let socket: WebSocket | null = null;

  function connect(recorder: MediaRecorder): void {
    onStatus('connecting');
    socket = new WebSocket(DEEPGRAM_URL, ['token', apiKey]);

    socket.onopen = () => {
      onStatus('connected');
      recorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0 && socket && socket.readyState === WebSocket.OPEN) {
          socket.send(e.data);
        }
      });
      recorder.start(250);
    };

    socket.onmessage = (e) => {
      let data: DeepgramMessage;
      try {
        data = JSON.parse(e.data as string) as DeepgramMessage;
      } catch {
        return;
      }
      if (!data || !data.channel) return;
      const transcript = data.channel.alternatives?.[0]?.transcript ?? '';
      if (!transcript.trim()) return;
      onTranscript({ text: transcript, isFinal: Boolean(data.is_final) });
    };

    socket.onerror = () => onStatus('error');
    socket.onclose = () => onStatus('disconnected');
  }

  function close(): void {
    if (socket && socket.readyState === WebSocket.OPEN) socket.close();
    socket = null;
  }

  return { connect, close };
}
