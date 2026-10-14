import { RedirectIfAuthed } from '@/components/ui/AuthGate';

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RedirectIfAuthed />
      {children}
    </>
  );
}
