'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Camera, Clapperboard, PenSquare, Radio, Sparkles, X } from 'lucide-react'
import { useI18n } from '@/i18n/client'
import { useToast } from '@/components/ui/Toast'

type Kind = 'post' | 'photo' | 'video' | 'story' | 'live'

/** Нижня шторка кнопки «+»: допис, фото, відео, історія, прямий ефір (скоро). */
export function CreateSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname() || '/'
  const toast = useToast()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const choose = (kind: Kind) => {
    if (kind === 'live') { toast.info(t('cabinet.create.liveSoon')); onClose(); return }
    // Усе створення — у повноекранній студії (текст, фото, історія, рілс), як у TikTok / Instagram
    window.dispatchEvent(new CustomEvent('svoi:create', { detail: { mode: kind === 'video' ? 'reel' : kind === 'post' ? 'text' : kind } }))
    onClose()
  }

  const items: { kind: Kind; icon: typeof PenSquare; label: string; soon?: boolean }[] = [
    { kind: 'post', icon: PenSquare, label: t('cabinet.create.post') },
    { kind: 'photo', icon: Camera, label: t('cabinet.create.photo') },
    { kind: 'video', icon: Clapperboard, label: t('cabinet.create.video') },
    { kind: 'story', icon: Sparkles, label: t('cabinet.create.story') },
    { kind: 'live', icon: Radio, label: t('cabinet.create.live'), soon: true },
  ]

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label={t('cabinet.create.title')}>
      <button type="button" aria-label={t('cabinet.create.close')} onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-4 pb-[calc(1.25rem+var(--safe-area-inset-bottom,0px))] shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-neutral-300" aria-hidden />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-neutral-900">{t('cabinet.create.title')}</h2>
          <button type="button" onClick={onClose} aria-label={t('cabinet.create.close')} className="p-2 rounded-full hover:bg-neutral-100"><X className="w-5 h-5" /></button>
        </div>
        <ul className="grid grid-cols-3 gap-3">
          {items.map(({ kind, icon: Icon, label, soon }) => (
            <li key={kind}>
              <button type="button" onClick={() => choose(kind)} className="relative w-full rounded-2xl bg-[#0b2a6b] text-white py-4 flex flex-col items-center gap-2 active:scale-95 transition">
                <Icon className="w-7 h-7 text-primary-400" />
                <span className="text-xs font-semibold px-1 leading-tight">{label}</span>
                {soon && <span className="absolute top-1.5 right-1.5 rounded-full bg-primary-500 text-neutral-900 text-[9px] font-bold uppercase px-1.5 py-0.5">{t('cabinet.shell.soon')}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
