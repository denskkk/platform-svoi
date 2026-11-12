'use client';

import { ComingSoon } from '@/components/projects/ComingSoon';
import { useI18n } from '@/i18n/client';

export default function VideoPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-6 pt-6 pb-28 md:pb-12">
        <ComingSoon icon="🎬" title={t('projects.video.title')} description={t('projects.video.description')} backHref="/feed" backLabel={t('projects.toFeed')} />
      </div>
    </div>
  );
}
