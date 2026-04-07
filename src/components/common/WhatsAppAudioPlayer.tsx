import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export type WhatsAppAudioPlayerProps = {
  src: string;
  className?: string;
  waveformBars?: number;
  showElapsedTime?: boolean;
};

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

function getPlayableDuration(audio: HTMLAudioElement) {
  if (Number.isFinite(audio.duration) && audio.duration > 0) return audio.duration;
  if (audio.seekable.length > 0) {
    const end = audio.seekable.end(audio.seekable.length - 1);
    if (Number.isFinite(end) && end > 0) return end;
  }
  return 0;
}

function fallbackBars(count: number) {
  return Array.from({ length: count }, (_, idx) => {
    const seed = ((idx + 3) * 37) % 97;
    return 7 + (seed % 16);
  });
}

export function WhatsAppAudioPlayer({
  src,
  className,
  waveformBars = 36,
  showElapsedTime = true,
}: WhatsAppAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bars, setBars] = useState<number[]>(() => fallbackBars(waveformBars));

  useEffect(() => {
    let mounted = true;
    setBars(fallbackBars(waveformBars));

    const decodeWaveform = async () => {
      let audioContext: AudioContext | null = null;
      try {
        const response = await fetch(src);
        const buffer = await response.arrayBuffer();
        const AudioCtx =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return;

        audioContext = new AudioCtx();
        const decoded = await audioContext.decodeAudioData(buffer.slice(0));
        const raw = decoded.getChannelData(0);
        const sampleCount = Math.max(8, waveformBars);
        const blockSize = Math.floor(raw.length / sampleCount) || 1;
        const nextBars = new Array(sampleCount).fill(0).map((_, i) => {
          let sum = 0;
          const start = i * blockSize;
          const end = Math.min(start + blockSize, raw.length);
          for (let j = start; j < end; j += 1) sum += Math.abs(raw[j]);
          const avg = sum / Math.max(1, end - start);
          return Math.max(6, Math.min(24, Math.round(avg * 64)));
        });

        if (mounted) setBars(nextBars);
      } catch {
        // Keep fallback bars if waveform decode is blocked or unsupported.
      } finally {
        if (audioContext) {
          await audioContext.close().catch(() => undefined);
        }
      }
    };

    void decodeWaveform();
    return () => {
      mounted = false;
    };
  }, [src, waveformBars]);

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const rootClassName = [
    'inline-block max-w-full rounded-2xl border border-slate-200 bg-white p-3',
    className ?? '',
  ]
    .join(' ')
    .trim();

  return (
    <div className={rootClassName}>
      <audio
        ref={audioRef}
        src={src}
        preload='metadata'
        onLoadedMetadata={(e) => setDuration(getPlayableDuration(e.currentTarget))}
        onDurationChange={(e) => setDuration(getPlayableDuration(e.currentTarget))}
        onCanPlay={(e) => setDuration(getPlayableDuration(e.currentTarget))}
        onTimeUpdate={(e) => {
          const audioEl = e.currentTarget;
          setCurrentTime(audioEl.currentTime || 0);
          setDuration((prev) => {
            const next = getPlayableDuration(audioEl);
            return next > 0 ? next : prev;
          });
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={() => void togglePlayback()}
          className='flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200'
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className='ml-0.5' />}
        </button>

        <button
          type='button'
          onClick={(event) => {
            const audio = audioRef.current;
            const waveform = waveformRef.current;
            if (!audio || !waveform || duration <= 0) return;
            const rect = waveform.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const ratio = Math.min(1, Math.max(0, x / rect.width));
            const nextTime = duration * ratio;
            audio.currentTime = nextTime;
            setCurrentTime(nextTime);
          }}
          className='group w-[min(360px,calc(100vw-12rem))] min-w-0'
          aria-label='Audio progress'
        >
          <div ref={waveformRef} className='flex items-center gap-1.5'>
            {bars.map((height, idx) => {
              const barProgress = ((idx + 1) / bars.length) * 100;
              const played = barProgress <= progressPercent;
              return (
                <span
                  key={`wave-${idx}-${height}`}
                  className={`w-1 shrink-0 rounded-full transition-colors ${
                    played ? 'bg-[#2BA1F9]' : 'bg-slate-300'
                  }`}
                  style={{ height }}
                  aria-hidden
                />
              );
            })}
          </div>
        </button>
      </div>

      {showElapsedTime ? (
        <div className='mt-1 flex items-center px-11 text-[11px] text-slate-500'>
          <span>{formatAudioTime(currentTime)}</span>
        </div>
      ) : null}
    </div>
  );
}
