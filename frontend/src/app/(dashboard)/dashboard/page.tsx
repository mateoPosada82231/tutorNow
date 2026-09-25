'use client';

import Link from 'next/link';
import { BookOpen, CalendarClock, KeyRound, User, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface ActionCardProps {
  href?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  soon?: boolean;
}

function ActionCard({ href, icon: Icon, title, description, soon }: ActionCardProps) {
  const base =
    'group relative flex h-full flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-6 text-left transition-all duration-200';
  const interactive =
    'hover:-translate-y-1 hover:border-brand-poli hover:shadow-xl hover:shadow-brand-poli/10 focus:outline-none focus:ring-2 focus:ring-brand-poli';
  const disabled = 'cursor-default opacity-70';

  const content = (
    <>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-white shadow-md transition-transform duration-200 group-hover:scale-110">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold text-text-main">
          {title}
          {soon && (
            <span className="rounded-full bg-brand-accent/20 px-2 py-0.5 text-xs font-semibold text-text-main">
              Proximamente
            </span>
          )}
        </h3>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
    </>
  );

  if (!href) {
    return <div className={`${base} ${disabled}`}>{content}</div>;
  }
  return (
    <Link href={href} className={`${base} ${interactive}`}>
      {content}
    </Link>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.fullName?.split(' ')[0] ?? 'estudiante';
  const isTutor = user?.role === 'TUTOR';

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] p-6 text-white shadow-lg transition-shadow duration-300 md:p-10">
        <span
          className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <span
          className="absolute -bottom-16 right-24 h-56 w-56 rounded-full bg-white/5"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            {isTutor ? 'Tutor activo' : 'Estudiante'}
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">Hola, {firstName}</h1>
          <p className="max-w-xl text-sm text-white/90 md:text-base">
            Bienvenido a tutorNow, la plataforma de asesorias academicas entre pares del Politecnico.
            Gestiona tu perfil y preparate para conectar con otros estudiantes.
          </p>
        </div>
      </section>

      <section aria-label="Accesos rapidos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          href="/profile"
          icon={User}
          title="Mi perfil"
          description={
            isTutor
              ? 'Actualiza tu informacion academica y tu perfil de tutor.'
              : 'Actualiza tu informacion academica o conviertete en tutor.'
          }
        />
        {isTutor && (
          <ActionCard
            href="/tutoring"
            icon={BookOpen}
            title="Panel de tutor"
            description="Gestiona tus asesorias, solicitudes recibidas y disponibilidad."
          />
        )}
        <ActionCard
          href="/settings/password"
          icon={KeyRound}
          title="Seguridad"
          description="Cambia tu contrasena de forma segura en dos pasos."
        />
        {!isTutor && (
          <ActionCard
            icon={CalendarClock}
            title="Asesorias"
            description="Agenda y gestiona tus asesorias academicas. Disponible en el proximo sprint."
            soon
          />
        )}
      </section>

      <section className="rounded-2xl border border-dashed border-border-color p-6 md:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-poli/10 text-brand-poli">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-text-main">Solicitudes de asesoria</h2>
          <p className="max-w-md text-sm text-text-muted">
            Aqui podras publicar solicitudes de ayuda, recibir propuestas de tutores y dejar resenas
            despues de cada asesoria.
          </p>
        </div>
      </section>
    </div>
  );
}
