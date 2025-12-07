export interface Marca {
  id: number;
  nombre: string;
  modelos: Modelo[];
}

export interface HistorialModel {
  id: number;
  fecha_siguiente_servicio: string;
  kilometraje_siguiente_servicio: number;
  fecha_turno: string;
  fecha_entrega: string | null;
  kilometraje: number;
  observaciones_tecnicas: string | null;
  mantenimiento: string;
  agenda: number | null;
  cliente: number;
  vehiculo: number;
  taller: number;
  tecnico: number;
}

export interface Modelo {
  id: number;
  nombre: string;
}

export interface Vehiculo {
  id: number;
  marca: Marca;
  fecha_prox_servicio: string;
  kilometraje_prox_servicio: number;
  historial: HistorialModel[];
  año: number;
  dominio: string;
  intervalo_servicio_km: number;
  intervalo_servicio_meses: number;
  modelo: Modelo;
  propietario: number;
}

export interface VehiculoCreatePayload {
  propietario: number;   // id de Cliente
  año: number;
  dominio: string;
  intervalo_servicio_km: number;
  intervalo_servicio_meses: number;
  modelo_id: number;
}

export interface MarcaCreatePayload {
  nombre: string;
}

export interface ModeloCreatePayload {
  nombre: string;
  marca : number;
}