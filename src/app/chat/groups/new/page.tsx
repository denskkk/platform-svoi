'use client';

import { useRouter } from 'next/navigation';
import { MenuShell } from '@/components/cabinet/MenuShell';
import { NewGroupForm } from '@/components/chat/NewGroupForm';
import { useI18n } from '@/i18n/client';

export default function NewGroupChatPage() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <MenuShell title={t('cabinet.groupChats.new')} backHref="/chat">
      <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-4">
        <NewGroupForm onCreated={(id) => router.push(`/chat/groups/${id}`)} />
      </div>
    </MenuShell>
  );
}
