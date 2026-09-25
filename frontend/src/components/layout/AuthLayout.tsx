import Image from 'next/image';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-4 py-8">
      <span
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-poli/10 blur-3xl"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-accent/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo-pjic.png"
            alt="Politecnico Jaime Isaza Cadavid"
            width={64}
            height={64}
            className="h-16 w-16 rounded-2xl object-cover shadow-md"
            priority
          />
          <span className="text-3xl font-bold text-brand-poli">tutorNow</span>
          <p className="text-sm text-text-muted">Asesorias academicas entre pares</p>
        </div>
        <div className="w-full rounded-2xl border border-border-color bg-bg-surface p-6 shadow-lg transition-colors duration-300 md:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}

