import { RedirectIfAuthed } from '@/components/ui/AuthGate';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RedirectIfAuthed />
      {children}
    </>
  );
}
