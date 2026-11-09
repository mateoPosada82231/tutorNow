'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileWarning, Flag, FolderX, Users } from 'lucide-react';

const TABS = [
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/publications', label: 'Publicaciones', icon: FolderX },
  { href: '/admin/reviews', label: 'Reseñas', icon: FileWarning },
  { href: '/admin/reports', label: 'Reportes', icon: Flag },
];

export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones del panel de administracion" className="flex gap-1 overflow-x-auto pb-1">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href) ?? false;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
              active
                ? 'bg-brand-poli text-white'
                : 'text-text-muted hover:bg-brand-poli/10 hover:text-brand-poli'
            }`}
          >
            <tab.icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
