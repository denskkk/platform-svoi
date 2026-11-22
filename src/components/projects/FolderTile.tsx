/** Плитка-«кубик» папки: з картинкою (фото на всю плитку з підписом знизу) або з іконкою-емодзі. Спільна для проєктів і клубів. */
export function folderTileCls(image?: string): string {
  return image
    ? 'relative w-full h-full min-h-[8rem] overflow-hidden rounded-2xl bg-neutral-800 shadow-md hover:shadow-lg active:scale-[0.98] transition flex flex-col items-center justify-end text-center'
    : 'w-full h-full min-h-[7rem] rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-[0.98] transition p-3 flex flex-col items-center justify-center gap-2 text-center';
}

export function FolderTileInner({ image, icon, label, arrow }: { image?: string; icon: string; label: string; arrow?: boolean }) {
  if (image) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <span className="relative w-full px-3 pb-3 pt-10 text-sm font-bold text-white leading-snug drop-shadow">{label}{arrow ? ' ›' : ''}</span>
      </>
    );
  }
  return (
    <>
      <span className="text-4xl" aria-hidden>{icon}</span>
      <span className="text-sm font-bold text-neutral-900 leading-snug">{label}</span>
      {arrow && <span aria-hidden className="text-neutral-400 text-xs">›</span>}
    </>
  );
}
