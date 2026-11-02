'use client';

import Link from 'next/link';
import { BookOpen, CalendarClock, MessageSquare, MessageSquarePlus, BookOpenCheck, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatUnreadStore } from '@/features/chat/stores/useChatUnreadStore';

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
  const totalUnread = useChatUnreadStore((state) => state.getTotal());

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

      {totalUnread > 0 && (
        <section
          aria-label="Mensajes sin leer"
          className="flex flex-col gap-4 rounded-2xl border border-brand-poli/30 bg-brand-poli/10 p-6 shadow-sm transition-all duration-200 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-poli text-white shadow-md">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text-main">
                {totalUnread === 1
                  ? 'Tienes 1 mensaje sin leer'
                  : `Tienes ${totalUnread} mensajes sin leer`}
              </h2>
              <p className="text-sm text-text-muted">
                Cada mensaje nuevo genera un correo simulado en tu bandeja de entrada.
              </p>
            </div>
          </div>
          <Link
            href="/tutoring/chats"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-poli px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-poli-hover hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-poli sm:ml-auto"
          >
            Ver mensajes
          </Link>
          <Link
            href="/dev/inbox"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-brand-poli/30 px-4 py-2.5 text-sm font-medium text-brand-poli transition-colors duration-200 hover:bg-brand-poli/10 focus:outline-none focus:ring-2 focus:ring-brand-poli"
          >
            Bandeja de entrada
          </Link>
        </section>
      )}

      <section aria-label="Accesos rapidos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          href="/tutoring/requests/new"
          icon={MessageSquarePlus}
          title="Publicar asesoría"
          description="Publica lo que necesitas aprender y recibe propuestas de tutores."
        />
        <ActionCard
          href="/tutoring/requests"
          icon={CalendarClock}
          title="Mis asesorías"
          description={
            isTutor
              ? 'Revisa las solicitudes de los estudiantes y tus asesorias aceptadas.'
              : 'Revisa el estado de tus solicitudes y asesorias aceptadas.'
          }
        />
        {isTutor && (
          <ActionCard
            href="/tutoring/explore"
            icon={BookOpenCheck}
            title="Explorar asesorías"
            description="Encuentra solicitudes de estudiantes y ofrece tu ayuda."
          />
        )}
        <ActionCard
          href="/tutoring/chats"
          icon={MessageSquare}
          title="Chats"
          description="Conversa en tiempo real con tu tutor o estudiante en cada asesoría."
        />
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
