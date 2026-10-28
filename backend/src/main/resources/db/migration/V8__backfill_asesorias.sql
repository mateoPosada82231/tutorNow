INSERT INTO asesorias (solicitud_id, propuesta_id, estudiante_id, tutor_id, estado, created_at, updated_at)
SELECT s.id, p.id, s.estudiante_id, p.tutor_id, 'PENDIENTE', p.updated_at, NOW()
FROM solicitudes_asesoria s
JOIN propuestas p ON p.solicitud_id = s.id AND p.estado = 'ACEPTADA'
WHERE s.estado = 'CONFIRMADA'
  AND NOT EXISTS (SELECT 1 FROM asesorias a WHERE a.solicitud_id = s.id);
