'use client'

// Остання лінія захисту: спрацьовує, якщо впав сам кореневий layout.
// Стилі тут інлайном, бо globals.css міг не завантажитись.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="uk">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fffbea' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ maxWidth: 380, width: '100%', textAlign: 'center', background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>
            <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>Щось пішло не так</h1>
            <p style={{ color: '#555', margin: '0 0 24px' }}>
              Сталася тимчасова помилка. Ваш вхід збережено — спробуйте ще раз.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{ padding: '12px 20px', borderRadius: 8, border: 0, background: '#e6b800', fontWeight: 600, fontSize: 16, marginRight: 8 }}
            >
              Спробувати ще раз
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              style={{ padding: '12px 20px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', fontSize: 16 }}
            >
              На головну
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
