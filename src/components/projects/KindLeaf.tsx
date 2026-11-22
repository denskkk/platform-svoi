'use client';

import { useI18n } from '@/i18n/client';
import { ProjectFolder } from '@/lib/projectFolders';
import { ProjectForm, FormKind } from './ProjectForm';
import { RepApplyFlow } from './RepApplyFlow';
import { RepTree } from './RepTree';
import { RepKind } from '@/lib/rep';

/** Простір імен текстів довідкових сторінок за проєктом: projects.<ns>.text.<папка>_<підпапка> */
const TEXT_NS: Record<string, string> = { taxi: 'taxi', 'real-estate': 'realEstate' };

/** Спеціальні екрани кінцевих папок (не каталог): дерево представництв, заявка з маршрутом, звернення, довідка. */
export function KindLeaf({ project, node, path }: { project: string; node: ProjectFolder; path: string }) {
  const { t } = useI18n();
  const [type, arg] = (node.kind || '').split(':');
  if (type === 'reptree') return <RepTree project={project} />;
  if (type === 'repapply') return <RepApplyFlow project={project} kind={arg as RepKind} />;
  if (type === 'form' || type === 'formp' || type === 'forma') {
    return (
      <div className="space-y-3">
        <p className="rounded-2xl bg-black/30 backdrop-blur text-sm text-white p-3">{t(`projects.taxi.form.lead.${arg}`)}</p>
        <ProjectForm projectSlug={project} kind={arg as FormKind} label={t(node.labelKey)} withPlace={type === 'formp'} withAttach={type === 'forma'} />
      </div>
    );
  }
  if (type === 'info') {
    const key = `projects.${TEXT_NS[project] || project}.text.${path.replace('.', '_')}`;
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-white p-4 shadow-md"><p className="text-sm text-neutral-800 whitespace-pre-line">{t(key)}</p></div>
        <p className="text-xs font-semibold text-white/80 px-1">{t('projects.taxi.info.ask')}</p>
        <ProjectForm projectSlug={project} kind="consult" label={t(node.labelKey)} />
      </div>
    );
  }
  return null;
}
