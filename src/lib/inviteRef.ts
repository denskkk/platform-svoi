/** Код запрошення на клієнті: з адреси (?ref=) або збережений після переходу по посиланню/QR (/invite/<код>). */
export function readInviteRef(): string | undefined {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('ref');
    const code = fromUrl || localStorage.getItem('svoi_ref');
    return code ? code.replace(/[^A-Za-z0-9]/g, '').slice(0, 16) || undefined : undefined;
  } catch { return undefined; }
}
