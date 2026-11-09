'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Flag, RefreshCw, X } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import {
  dismissReport,
  fetchAdminReport,
  listAdminReports,
  resolveReport,
} from '@/features/admin/api/adminApi';
import {
  LABEL_ESTADO_REPORTE,
  LABEL_TIPO_REPORTE,
  PaginationControls,
  StatusBadge,
  TONE_BY_ESTADO_REPORTE,
  formatFecha,
} from '@/features/admin/components';
import type {
  AdminReport,
  AdminReportDetail,
  PageResponse,
} from '@/features/admin/types';

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'RESUELTO', label: 'Resueltos' },
  { value: 'DESCARTADO', label: 'Descartados' },
];

const TIPO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PUBLICACION', label: 'Publicaciones' },
  { value: 'RESENA', label: 'Resenas' },
  { value: 'USUARIO', label: 'Usuarios' },
];

const RESOLUCION_MIN = 5;
const RESOLUCION_MAX = 500;

export default function AdminReportsPage() {
  const [page, setPage] = useState(0);
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [result, setResult] = useState<PageResponse<AdminReport> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      setResult(
        await listAdminReports({
          estado: estado || undefined,
          tipo: tipo || undefined,
          page,
          size: 10,
        }),
      );
    } catch {
      setActionError('No pudimos cargar los reportes. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [estado, tipo, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section aria-label="Gestion de reportes" className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
        }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <Select
          id="admin-reports-estado"
          label="Estado"
          options={ESTADO_OPTIONS}
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        />
        <Select
          id="admin-reports-tipo"
          label="Tipo"
          options={TIPO_OPTIONS}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        />
        <div className="sm:col-span-2 sm:-mt-1">
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
          {result.data.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onOpen={() => setSelectedId(report.id)}
            />
          ))}
          <PaginationControls pagination={result.pagination} onChangePage={setPage} />
        </div>
      ) : (
        <Alert type="info">No hay reportes que coincidan con los filtros.</Alert>
      )}

      {selectedId !== null && (
        <ReportDetailModal
          reportId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </section>
  );
}

interface ReportCardProps {
  report: AdminReport;
  onOpen: () => void;
}

function ReportCard({ report, onOpen }: ReportCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-200 hover:border-brand-poli md:flex-row md:items-center md:justify-between md:p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={LABEL_ESTADO_REPORTE[report.estado]}
            tone={TONE_BY_ESTADO_REPORTE[report.estado]}
          />
          <StatusBadge label={LABEL_TIPO_REPORTE[report.tipo]} tone="info" />
        </div>
        <h2 className="text-base font-semibold text-text-main">{report.motivo}</h2>
        <p className="truncate text-sm text-text-muted">
          Reportado por {report.reportador.fullName} &middot; {formatFecha(report.createdAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex min-h-[44px] items-center justify-end gap-1 rounded-lg px-2 text-sm font-semibold text-brand-poli transition-colors duration-200 hover:bg-brand-poli/10"
      >
        Gestionar
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </article>
  );
}

interface ReportDetailModalProps {
  reportId: number;
  onClose: () => void;
  onChanged: () => void;
}

function ReportDetailModal({ reportId, onClose, onChanged }: ReportDetailModalProps) {
  const [detail, setDetail] = useState<AdminReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolucion, setResolucion] = useState('');
  const [resolucionError, setResolucionError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<'resolve' | 'dismiss' | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchAdminReport(reportId);
        if (cancelled) return;
        setDetail(data);
      } catch {
        if (!cancelled) setLoadError('No pudimos cargar el reporte.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  async function cerrar(modo: 'resolve' | 'dismiss') {
    const trimmed = resolucion.trim();
    if (trimmed.length < RESOLUCION_MIN) {
      setResolucionError(`La resolucion debe tener al menos ${RESOLUCION_MIN} caracteres`);
      return;
    }
    setResolucionError(undefined);
    setActing(modo);
    try {
      const updated =
        modo === 'resolve'
          ? await resolveReport({ reportId, resolucion: trimmed })
          : await dismissReport({ reportId, resolucion: trimmed });
      setDetail((current) => (current ? { ...current, ...updated, target: current.target } : current));
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error && err.message ? err.message : 'La accion fallo. Intenta de nuevo.',
      );
    } finally {
      setActing(null);
    }
  }

  const pendiente = detail?.estado === 'PENDIENTE';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-border-color bg-bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 id="report-detail-title" className="flex items-center gap-2 text-lg font-semibold text-text-main">
            <Flag className="h-5 w-5 text-error" aria-hidden="true" />
            Reporte #{reportId}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-muted transition-colors duration-200 hover:bg-brand-poli/10 hover:text-brand-poli"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : loadError ? (
          <Alert type="error">{loadError}</Alert>
        ) : detail ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={LABEL_ESTADO_REPORTE[detail.estado]}
                tone={TONE_BY_ESTADO_REPORTE[detail.estado]}
              />
              <StatusBadge label={LABEL_TIPO_REPORTE[detail.tipo]} tone="info" />
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <p>
                <span className="font-medium text-text-muted">Motivo: </span>
                <span className="text-text-main">{detail.motivo}</span>
              </p>
              {detail.descripcion ? (
                <p className="text-text-main">
                  <span className="font-medium text-text-muted">Descripcion: </span>
                  {detail.descripcion}
                </p>
              ) : null}
              <p className="text-text-muted">
                Reportado por {detail.reportador?.fullName ?? 'Usuario no disponible'}
                {detail.reportador?.email ? ` (${detail.reportador.email})` : ''} &middot;{' '}
                {formatFecha(detail.createdAt)}
              </p>
              {detail.resolucion ? (
                <p className="text-text-main">
                  <span className="font-medium text-text-muted">Resolucion: </span>
                  {detail.resolucion}
                </p>
              ) : null}
            </div>

            {detail.target ? (
              <div className="rounded-lg border border-border-color bg-bg-primary p-3 text-sm">
                <p className="mb-1 font-semibold text-text-main">Contenido reportado</p>
                {detail.target.tema ? <p className="text-text-main">&ldquo;{detail.target.tema}&rdquo;</p> : null}
                {detail.target.tema && detail.target.materia ? (
                  <p className="text-text-muted">{detail.target.materia.label}</p>
                ) : null}
                {detail.target.comentario ? (
                  <p className="text-text-main">&ldquo;{detail.target.comentario}&rdquo;</p>
                ) : null}
                {detail.target.rating ? (
                  <p className="text-text-muted">Calificacion: {detail.target.rating}/5</p>
                ) : null}
                {(detail.target.estadoModeracion) ? (
                  <p className="mt-1">
                    <StatusBadge
                      label={LABEL_ESTADO_MODERACION_[detail.target.estadoModeracion] ?? detail.target.estadoModeracion}
                      tone={detail.target.estadoModeracion === 'RETIRADA' ? 'danger' : 'success'}
                    />
                  </p>
                ) : null}
                {detail.target.rol || detail.target.activo !== undefined ? (
                  <p className="mt-1 text-text-muted">
                    {detail.target.rol ? `Rol: ${detail.target.rol}` : ''}
                    {detail.target.activo !== undefined ? (detail.target.rol ? ' · ' : '') + (detail.target.activo ? 'Cuenta activa' : 'Cuenta desactivada') : ''}
                  </p>
                ) : null}
                {(detail.target.autor || detail.target.estudiante) && (
                  <p className="mt-1 text-text-muted">
                    {detail.target.autor
                      ? `${detail.target.autor.fullName} (${detail.target.autor.email})`
                      : `${detail.target.estudiante?.fullName} (${detail.target.estudiante?.email})`}
                  </p>
                )}
              </div>
            ) : (
              <Alert type="info">El contenido reportado ya no existe.</Alert>
            )}

            {pendiente ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void cerrar('resolve');
                }}
                className="flex flex-col gap-2"
                noValidate
              >
                {error ? <Alert type="error">{error}</Alert> : null}
                <label htmlFor="report-resolucion" className="text-sm font-medium text-text-main">
                  Resolucion
                </label>
                <textarea
                  id="report-resolucion"
                  rows={3}
                  maxLength={RESOLUCION_MAX}
                  placeholder="Como y por que se gestiono este reporte"
                  value={resolucion}
                  onChange={(e) => setResolucion(e.target.value)}
                  aria-invalid={resolucionError ? 'true' : 'false'}
                  className={`w-full rounded-lg border bg-bg-surface px-3 py-2 text-base text-text-main transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
                    resolucionError ? 'border-error' : 'border-border-color focus:border-brand-poli'
                  }`}
                />
                {resolucionError ? (
                  <p role="alert" className="text-sm text-error">
                    {resolucionError}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="submit" disabled={acting !== null} className="flex-1">
                    {acting === 'resolve' ? <Spinner size="sm" /> : 'Marcar resuelto'}
                  </Button>
                  <button
                    type="button"
                    disabled={acting !== null}
                    onClick={() => void cerrar('dismiss')}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-border-color px-4 text-base font-semibold text-text-muted transition-colors duration-200 hover:bg-bg-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {acting === 'dismiss' ? <Spinner size="sm" /> : 'Descartar reporte'}
                  </button>
                </div>
              </form>
            ) : (
              <Button onClick={onClose}>Cerrar</Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const LABEL_ESTADO_MODERACION_: Record<string, string> = {
  VISIBLE: 'Visible',
  RETIRADA: 'Retirada',
};
