import { PageLoader } from '@/components/ui/LoadingSpinner';

/** Загальний стан завантаження сторінки (поки сервер готує екран) */
export default function Loading() {
  return <PageLoader />;
}
