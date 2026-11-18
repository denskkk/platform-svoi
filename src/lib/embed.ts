/** Перетворює посилання на відео в безпечний вигляд для показу: YouTube/Vimeo — iframe, mp4 — <video>, інше — просте посилання. */
export type VideoEmbed = { kind: 'iframe' | 'video' | 'link'; src: string };

export function parseVideoUrl(url: string): VideoEmbed | null {
  const u = (url || '').trim();
  if (!u) return null;
  if (/^\/uploads\/videos\/v\d+\.mp4$/.test(u)) return { kind: 'video', src: u };
  let parsed: URL;
  try { parsed = new URL(u); } catch { return null; }
  if (parsed.protocol !== 'https:') return null;
  const host = parsed.hostname.replace(/^www\./, '');
  let id = '';
  if (host === 'youtu.be') id = parsed.pathname.slice(1);
  else if (host === 'youtube.com' || host === 'm.youtube.com') id = parsed.searchParams.get('v') || (/^\/(embed|shorts)\/([\w-]{6,20})/.exec(parsed.pathname)?.[2] ?? '');
  if (/^[\w-]{6,20}$/.test(id)) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` };
  if (host === 'vimeo.com') {
    const vid = /^\/(\d{4,12})/.exec(parsed.pathname)?.[1];
    if (vid) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vid}` };
  }
  if (/\.(mp4|webm)$/i.test(parsed.pathname)) return { kind: 'video', src: u };
  return { kind: 'link', src: u };
}
