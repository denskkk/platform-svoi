/** Плитка папки: фото на всю плитку з підписом знизу; без фото — чиста світла плитка з підписом (без емодзі). Спільна для проєктів і клубів. */
export function folderTileCls(image?: string): string {
  return image
    ? 'group relative w-full h-full min-h-[8.5rem] sm:min-h-[10rem] overflow-hidden rounded-3xl bg-neutral-800 shadow-md ring-1 ring-white/10 hover:shadow-xl active:scale-[0.98] transition duration-300 flex flex-col items-center justify-end text-center'
    : 'w-full h-full min-h-[6.5rem] rounded-3xl bg-white/90 shadow-md ring-1 ring-black/5 hover:shadow-lg active:scale-[0.98] transition p-4 flex flex-col items-center justify-center gap-1 text-center';
}

export function FolderTileInner({ image, label, arrow }: { image?: string; icon?: string; label: string; arrow?: boolean }) {
  if (image) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        <span className="relative w-full px-3 pb-3.5 pt-12 text-sm sm:text-base font-bold text-white leading-snug drop-shadow">{label}{arrow ? ' ›' : ''}</span>
      </>
    );
  }
  return (
    <>
      <span className="text-sm sm:text-base font-bold text-neutral-900 leading-snug">{label}</span>
      {arrow && <span aria-hidden className="text-neutral-400 text-xs">›</span>}
    </>
  );
}
