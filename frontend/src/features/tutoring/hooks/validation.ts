import type { TutoringRequestRequest } from '../types';

export interface TutoringRequestFieldErrors {
  materiaId?: string;
  tema?: string;
  modalidad?: string;
  disponibilidad?: string;
  descripcion?: string;
}

export function validateMateriaId(materiaId: number): string | null {
  if (!materiaId || materiaId <= 0) return 'Selecciona una asignatura';
  return null;
}

export function validateTema(tema: string): string | null {
  const value = tema.trim();
  if (!value) return 'El tema de la asesoria es obligatorio';
  if (value.length < 5) return 'El tema debe tener al menos 5 caracteres';
  if (value.length > 120) return 'El tema no puede superar 120 caracteres';
  return null;
}

export function validateModalidad(modalidad: string): string | null {
  if (modalidad !== 'VIRTUAL' && modalidad !== 'PRESENCIAL') return 'Selecciona una modalidad';
  return null;
}

export function validateDisponibilidad(disponibilidad: string): string | null {
  const value = disponibilidad.trim();
  if (!value) return 'Indica tu disponibilidad';
  if (value.length < 5) return 'La disponibilidad debe tener al menos 5 caracteres';
  if (value.length > 300) return 'La disponibilidad no puede superar 300 caracteres';
  return null;
}

export function validateDescripcion(descripcion: string): string | null {
  if (descripcion.trim().length > 1000) return 'La descripcion no puede superar 1000 caracteres';
  return null;
}

export function validateMensaje(mensaje: string): string | null {
  const value = mensaje.trim();
  if (!value) return 'El mensaje es obligatorio';
  if (value.length < 10) return 'El mensaje debe tener al menos 10 caracteres';
  if (value.length > 500) return 'El mensaje no puede superar 500 caracteres';
  return null;
}

export function validateTutoringRequest(
  data: TutoringRequestRequest,
): TutoringRequestFieldErrors {
  const errors: TutoringRequestFieldErrors = {};
  const materiaError = validateMateriaId(data.materiaId);
  if (materiaError) errors.materiaId = materiaError;
  const temaError = validateTema(data.tema);
  if (temaError) errors.tema = temaError;
  const modalidadError = validateModalidad(data.modalidad);
  if (modalidadError) errors.modalidad = modalidadError;
  const disponibilidadError = validateDisponibilidad(data.disponibilidad);
  if (disponibilidadError) errors.disponibilidad = disponibilidadError;
  const descripcionError = validateDescripcion(data.descripcion ?? '');
  if (descripcionError) errors.descripcion = descripcionError;
  return errors;
}

export function hasFieldErrors(errors: TutoringRequestFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
