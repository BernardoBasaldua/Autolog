// import { Taller } from '../talleres/taller.model';
// import { Vehiculo } from '../vehiculo/vehiculo.model';

// export interface Turno {
//     id: number;
//     vehiculo: Vehiculo;
//     taller: Taller;
//     fecha: string; // Fecha del turno
//     hora: string; // Formato "HH:mm"
//     //estado: 'pendiente' | 'confirmado' | 'cancelado'; 
//     referente: string;// Estado del turno
// }

// export interface Turno {
//   id: number;
//   fecha_siguiente_servicio: string;      // "2026-09-06"
//   kilometraje_siguiente_servicio: number; // 31500
//   fecha_turno: string;                   // "2025-09-06T09:00:00Z"
//   fecha_entrega: string;                 // "2025-09-02"
//   kilometraje: number;                   // 21500
//   observaciones_tecnicas: string;        // texto largo
//   mantenimiento: string;                 // "preventivo"
//   agenda: number | null;                 // null o id
//   cliente: number;                       // id cliente
//   vehiculo: number;                      // id vehiculo
//   taller: number;                        // id taller
//   tecnico: number;                       // id tecnico
// }

export type EstadoOrden = 'pendiente' | 'en_proceso' | 'finalizada' | 'anulada';

export interface Turno {
  id: number;

  fecha_siguiente_servicio: string | null;        // puede venir null según backend
  kilometraje_siguiente_servicio: number | null;  // puede venir null según backend

  fecha_turno: string;                            // ISO string
  fecha_entrega: string | null;                   // ✅ en Django es null=True

  kilometraje: number;
  observaciones_tecnicas: string | null;
  mantenimiento: string;

  agenda: number | null;
  cliente: number;
  vehiculo: number;
  taller: number;
  tecnico: number;

  // ✅ NUEVO: estados
  estado: EstadoOrden;                            // estado “guardado” (terminal o sync)
  estado_actual?: EstadoOrden;                    // estado calculado que mandás en serializer
}