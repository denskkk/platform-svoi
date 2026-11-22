'use client';

import { useI18n } from '@/i18n/client';
import { ProjectFolder } from '@/lib/projectFolders';
import { ProjectForm, FormKind } from './ProjectForm';
import { RepApplyFlow } from './RepApplyFlow';
import { RepTree } from './RepTree';
import { RepKind } from '@/lib/rep';

/** Спеціальні екрани кінцевих папок (не каталог): дерево представництв, заявка з маршрутом, звернення. */
export function KindLeaf({ project, node }: { project: string; node: ProjectFolder }) {
  const { t } = useI18n();
  const [type, arg] = (node.kind || '').split(':');
  if (type === 'reptree') return <RepTree project={project} />;
  if (type === 'repapply') return <RepApplyFlow project={project} kind={arg as RepKind} />;
  if (type === 'form') {
    return (
      <div className="space-y-3">
        <p className="rounded-2xl bg-black/30 backdrop-blur text-sm text-white p-3">{t(`projects.taxi.form.lead.${arg}`)}</p>
        <ProjectForm projectSlug={project} kind={arg as FormKind} label={t(node.labelKey)} />
      </div>
    );
  }
  return null;
}
