'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, UserCheck, UserX, UserCog, RefreshCw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import {
  activateUser,
  deactivateUser,
  listAdminUsers,
  promoteAdmin,
  restoreTutor,
  revokeTutor,
} from '@/features/admin/api/adminApi';
import {
  PaginationControls,
  StatusBadge,
  TONE_BY_ROL,
  formatFecha,
} from '@/features/admin/components';
import type { AdminUser, PageResponse } from '@/features/admin/types';

const ROL_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ESTUDIANTE', label: 'Estudiante' },
  { value: 'TUTOR', label: 'Tutor' },
  { value: 'ADMIN', label: 'Administrador' },
];

const ACTIVO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

type UserAction = 'revoke' | 'restore' | 'deactivate' | 'activate' | 'promote';

export default function AdminUsersPage() {
  const [page, setPage] = useState(0);
  const [rol, setRol] = useState('');
  const [activo, setActivo] = useState('');
  const [q, setQ] = useState('');
  const [pendingQuery, setPendingQuery] = useState('');
  const [result, setResult] = useState<PageResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<UserAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      setResult(
        await listAdminUsers({
          rol: rol || undefined,
          activo: activo || undefined,
          q: pendingQuery || undefined,
          page,
          size: 10,
        }),
      );
    } catch {
      setActionError('No pudimos cargar los usuarios. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [rol, activo, pendingQuery, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAction(userId: number, action: UserAction) {
    setActionError(null);
    setActionInProgress((current) => current ?? action);
    try {
      if (action === 'revoke') await revokeTutor(userId);
      if (action === 'restore') await restoreTutor(userId);
      if (action === 'deactivate') await deactivateUser(userId);
      if (action === 'activate') await activateUser(userId);
      if (action === 'promote') await promoteAdmin(userId);
      await load();
    } catch (err) {
      setActionError(err instanceof Error && err.message ? err.message : 'La accion fallo. Intenta de nuevo.');
    } finally {
      setActionInProgress(null);
    }
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setPendingQuery(q.trim());
  }

  return (
    <section aria-label="Gestion de usuarios" className="flex flex-col gap-4">
      <form onSubmit={submitSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          id="admin-users-q"
          label="Buscar"
          type="search"
          placeholder="Nombre o correo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select
          id="admin-users-rol"
          label="Rol"
          options={ROL_OPTIONS}
          value={rol}
          onChange={(e) => setRol(e.target.value)}
        />
        <Select
          id="admin-users-activo"
          label="Estado"
          options={ACTIVO_OPTIONS}
          value={activo}
          onChange={(e) => setActivo(e.target.value)}
        />
        <div className="sm:col-span-3 sm:-mt-1">
          <Button type="submit" variant="ghost" className="w-auto">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Aplicar filtros
          </Button>
        </div>
      </form>

      {actionError ? <Alert type="error">{actionError}</Alert> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : result && result.data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {result.data.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              actionInProgress={actionInProgress}
              onAction={handleAction}
            />
          ))}
          <PaginationControls
            pagination={result.pagination}
            onChangePage={(next) => setPage(next)}
          />
        </div>
      ) : (
        <Alert type="info">No hay usuarios que coincidan con los filtros.</Alert>
      )}
    </section>
  );
}

interface UserCardProps {
  user: AdminUser;
  actionInProgress: UserAction | null;
  onAction: (userId: number, action: UserAction) => void;
}

function UserCard({ user, actionInProgress, onAction }: UserCardProps) {
  const busy = actionInProgress !== null;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-200 hover:border-brand-poli md:flex-row md:items-start md:justify-between md:p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-text-main">{user.fullName}</h2>
          <StatusBadge label={user.role} tone={TONE_BY_ROL[user.role]} />
          {!user.active && <StatusBadge label="Desactivado" tone="warning" />}
          {!user.verified && <StatusBadge label="Sin verificar" tone="warning" />}
        </div>
        <p className="truncate text-sm text-text-muted">{user.email}</p>
        <p className="mt-1 text-xs text-text-muted">Registrado: {formatFecha(user.createdAt)}</p>
        {user.role === 'TUTOR' && user.tutorReviews ? (
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <StatusBadge
              label={
                user.tutorReviews.averageRating !== null
                  ? `Resenas: ${user.tutorReviews.averageRating}/5 (${user.tutorReviews.reviewCount})`
                  : 'Sin resenas visibles'
              }
              tone={
                user.tutorReviews.averageRating !== null && user.tutorReviews.averageRating < 2.5
                  ? 'danger'
                  : 'neutral'
              }
            />
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 md:justify-end">
        {user.role === 'TUTOR' && (
          <ActionChip
            label="Revocar tutor"
            icon={<ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />}
            busy={busy && actionInProgress === 'revoke'}
            disabled={busy}
            tone="danger"
            onClick={() => onAction(user.id, 'revoke')}
          />
        )}
        {user.role === 'ESTUDIANTE' && user.hasTutorProfile && (
          <ActionChip
            label="Restaurar tutor"
            icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
            busy={busy && actionInProgress === 'restore'}
            disabled={busy}
            onClick={() => onAction(user.id, 'restore')}
          />
        )}
        {user.active ? (
          <ActionChip
            label="Desactivar cuenta"
            icon={<UserX className="h-3.5 w-3.5" aria-hidden="true" />}
            busy={busy && actionInProgress === 'deactivate'}
            disabled={busy}
            tone="danger"
            onClick={() => onAction(user.id, 'deactivate')}
          />
        ) : (
          <ActionChip
            label="Activar cuenta"
            icon={<UserCheck className="h-3.5 w-3.5" aria-hidden="true" />}
            busy={busy && actionInProgress === 'activate'}
            disabled={busy}
            onClick={() => onAction(user.id, 'activate')}
          />
        )}
        {user.role !== 'ADMIN' && (
          <ActionChip
            label="Hacer admin"
            icon={<UserCog className="h-3.5 w-3.5" aria-hidden="true" />}
            busy={busy && actionInProgress === 'promote'}
            disabled={busy}
            onClick={() => onAction(user.id, 'promote')}
          />
        )}
      </div>
    </article>
  );
}

interface ActionChipProps {
  label: string;
  icon: React.ReactNode;
  busy: boolean;
  disabled: boolean;
  tone?: 'default' | 'danger';
  onClick: () => void;
}

function ActionChip({ label, icon, busy, disabled, tone = 'default', onClick }: ActionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === 'danger'
          ? 'border border-error text-error hover:bg-error/10'
          : 'border border-border-color text-text-muted hover:border-brand-poli hover:text-brand-poli'
      }`}
    >
      {busy ? <Spinner size="sm" /> : icon}
      {label}
    </button>
  );
}
