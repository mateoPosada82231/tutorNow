export interface TutorSlot {
  id: number;
  diaSemana: string;
  horaInicio: string;
}

export interface TutorSlotRequest {
  diaSemana: string;
  horaInicio: string;
}

export interface TutorSlotsRequest {
  slots: TutorSlotRequest[];
}
