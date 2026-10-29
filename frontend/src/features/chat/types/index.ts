export interface EmisorBrief {
  id: number;
  fullName: string;
}

export interface Mensaje {
  id: number;
  asesoriaId: number;
  emisor: EmisorBrief;
  contenido: string;
  createdAt: string;
}

export interface MensajesPage {
  data: Mensaje[];
  pagination: {
    size: number;
    hasMore: boolean;
    nextBefore: number | null;
  };
}

export interface ChatResumen {
  asesoriaId: number;
  contraparte: EmisorBrief;
  materia: string;
  tema: string;
  estado: string;
  permiteEscritura: boolean;
  ultimoMensaje: string | null;
  ultimoMensajeAt: string | null;
  noLeidos: number;
}

export interface EnviarMensajeRequest {
  contenido: string;
  clientMessageId: string;
}

export interface MarcarLeidoRequest {
  ultimoMensajeId: number;
}