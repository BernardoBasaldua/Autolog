
export type EstadoOrden = 'pendiente' | 'en_proceso' | 'finalizada' | 'anulada';

export type TipoMantenimiento = 'preventivo' | 'correctivo';

// =========================
// MODELO PRINCIPAL (RESPUESTA API)
// =========================
export interface OrdenDeTrabajo {
  id: number;

  // TURNO
  agenda: number | null;          // FK agendas.Agenda
  fecha_turno: string;           // ISO string del backend (DateTimeField)
  fecha_entrega: string | null;  // ISO date (DateField)

  kilometraje: number;
  observaciones_tecnicas: string | null;

  // CALCULADOS (read_only)
  fecha_siguiente_servicio: string | null;        // Date
  kilometraje_siguiente_servicio: number | null;

  // SELECTOR
  mantenimiento: TipoMantenimiento;

  // ESTADOS (backend)
  estado: EstadoOrden;         // estado guardado (read_only)
  estado_actual: EstadoOrden;  // calculado por backend (read_only)

  // RELACIONES
  cliente: number;               // FK usuarios.Cliente
  vehiculo: number;              // FK vehiculos.Vehiculo
  taller: number | null;         // FK talleres.Taller
  //tecnico: number | null;        // FK usuarios.AdministradorTecnico
  responsable_tecnico: string | null; // Nombre del técnico responsable (calculado en backend)
}

// =========================
// PAYLOAD PARA CREAR
// =========================
export interface OrdenDeTrabajoCreatePayload {
  // agenda puede ser null porque el modelo lo permite
  agenda?: number | null;

  // requerido por modelo (no tiene null/blank)
  fecha_turno: string;

  // opcional
  fecha_entrega?: string | null;

  kilometraje?: number;
  observaciones_tecnicas?: string | null;

  // selector
  mantenimiento?: TipoMantenimiento;

  // relaciones requeridas
  cliente: number;
  vehiculo: number;

  // opcionales
  taller?: number | null;
  //tecnico?: number | null;
  responsable_tecnico?: string | null;

  // NO incluir:
  // - id
  // - fecha_siguiente_servicio
  // - kilometraje_siguiente_servicio
}

// =========================
// PAYLOAD PARA EDITAR
// =========================
export type OrdenDeTrabajoUpdatePayload =
  Partial<Omit<OrdenDeTrabajoCreatePayload, 'cliente' | 'vehiculo'>> & {

  };


export interface OrdenFinalizarPayload {
  fecha_entrega: string; // 'YYYY-MM-DD'
}