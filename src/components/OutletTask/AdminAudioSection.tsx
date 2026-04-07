import { WhatsAppAudioPlayer } from '../common/WhatsAppAudioPlayer';

type AdminAudioSectionProps = {
  audioUrls?: string[];
};

export function AdminAudioSection({ audioUrls }: AdminAudioSectionProps) {
  if (!audioUrls || audioUrls.length === 0) return null;

  return (
    <div className='w-fit max-w-full rounded-xl border border-slate-200 bg-white p-3'>
      <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
        Admin audio
      </p>
      <div className='space-y-2'>
        {audioUrls.map((url, idx) => (
          <WhatsAppAudioPlayer key={`admin-audio-${idx}-${url}`} src={url} />
        ))}
      </div>
    </div>
  );
}
