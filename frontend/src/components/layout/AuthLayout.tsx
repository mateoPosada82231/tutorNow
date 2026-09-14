export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-3xl font-bold text-brand-poli">tutorNow</span>
          <p className="mt-1 text-sm text-text-muted">Asesorias academicas entre pares</p>
        </div>
        <div className="w-full rounded-xl border border-border-color bg-bg-surface p-6 shadow-sm md:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
