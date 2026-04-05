import { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';

export interface UseMicRecordingOptions {
  /** Fired when the user stops recording and the blob is non-empty */
  onRecordingComplete?: (file: File) => void;
  /** e.g. show a toast */
  onError?: (message: string) => void;
  /** Passed to `MediaRecorder.start(timeslice)`; default 250 */
  timesliceMs?: number;
  /** File basename prefix; default `voice-note` */
  fileNamePrefix?: string;
}

export interface UseMicRecordingResult {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  /** Starts if idle, stops if recording */
  toggleRecording: () => void;
}

function pickAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

function extensionForAudioBlob(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4') || mime.includes('mpeg')) return 'm4a';
  return 'webm';
}

/**
 * Browser microphone capture via getUserMedia + MediaRecorder.
 * Stops tracks on unmount; does not call onRecordingComplete if unmounted before stop finishes.
 */
export function useMicRecording(options: UseMicRecordingOptions = {}): UseMicRecordingResult {
  const {
    onRecordingComplete,
    onError,
    timesliceMs = 250,
    fileNamePrefix = 'voice-note',
  } = options;

  const onRecordingCompleteRef = useRef(onRecordingComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
    onErrorRef.current = onError;
  }, [onRecordingComplete, onError]);

  const [isRecording, setIsRecording] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      const rec = mediaRecorderRef.current;
      if (rec && rec.state === 'recording') {
        rec.stop();
      }
    };
  }, []);

  const stopRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      onErrorRef.current?.('Recording is not supported in this browser.');
      return;
    }
    if (mediaRecorderRef.current?.state === 'recording') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = pickAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        const chunks = audioChunksRef.current;
        audioChunksRef.current = [];
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type });
        if (blob.size === 0 || !mountedRef.current) return;

        const ext = extensionForAudioBlob(type);
        const name = `${fileNamePrefix}-${dayjs().format('YYYY-MM-DD-HHmmss')}.${ext}`;
        const file = new File([blob], name, { type: blob.type || type });
        onRecordingCompleteRef.current?.(file);
      };

      recorder.start(timesliceMs);
      setIsRecording(true);
    } catch {
      onErrorRef.current?.('Microphone access was denied or is not available.');
    }
  }, [fileNamePrefix, timesliceMs]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
