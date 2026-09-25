'use client';

import Link from 'next/link';
import {
  CalendarClock,
  GraduationCap,
  Inbox,
  Pencil,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface TutorCardProps {
  href?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  soon?: boolean;
}

function TutorCard({ href, icon: Icon, title, description, soon }: TutorCardProps) {
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

export default function TutorPanelPage() {
  const user = useAuthStore((state) => state.user);
  const isTutor = user?.role === 'TUTOR';

  if (!isTutor) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <section className="rounded-2xl border border-border-color bg-gradient-to-br from-bg-surface to-brand-accent/10 p-8 shadow-sm transition-colors duration-300">
          <div className="flex flex-col items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-white shadow-md">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-text-main">Aun no eres tutor</h1>
              <p className="mt-2 text-sm text-text-muted">
                Este espacio es para quienes asesoran a otros estudiantes. Si quieres compartir lo
                que sabes, crea tu perfil de tutor desde tu pagina de perfil.
              </p>
            </div>
            <Link
              href="/profile"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli"
            >
              Ir a mi perfil
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] p-6 text-white shadow-lg transition-shadow duration-300 md:p-10">
        <span
          className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            Tutor activo
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">Panel de tutor</h1>
          <p className="max-w-xl text-sm text-white/90 md:text-base">
            Desde aqui podras gestionar tus asesorias, las solicitudes de los estudiantes y tu
            disponibilidad.
          </p>
        </div>
      </section>

      <section aria-label="Herramientas de tutor" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TutorCard
          icon={Inbox}
          title="Solicitudes recibidas"
          description="Revisa las solicitudes de asesoria de los estudiantes y envia propuestas."
          soon
        />
        <TutorCard
          icon={CalendarClock}
          title="Mi agenda"
          description="Configura tus horarios disponibles y gestiona las asesorias confirmadas."
          soon
        />
        <TutorCard
          icon={Star}
          title="Mis resenas"
          description="Consulta las calificaciones y comentarios que te dejan los estudiantes."
          soon
        />
        <TutorCard
          href="/profile"
          icon={Pencil}
          title="Editar perfil de tutor"
          description="Actualiza tu biografia y las materias que asesoras desde tu perfil."
        />
      </section>
    </div>
  );
}
