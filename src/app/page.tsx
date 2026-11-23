import { GuestWelcome } from '@/components/features/home/GuestWelcome'

// Гість бачить не стрічку, а вибір мови та реєстрацію (стрічка порожня без людей — вона відкривається після входу).
// Авторизованих GuestWelcome відправляє у /feed.
export default function Home() {
  return <GuestWelcome />
}
