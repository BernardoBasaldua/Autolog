import { Vehiculo } from "../vehiculo/vehiculo.model";
import { ClienteModel } from "../usuarios/usuario.model";
import { Taller } from "../talleres/taller.model";

export interface PermisoDeAcceso {
  id?: number;
  fecha_autorizacion?: string;
  vehiculo_autorizado: number;
  autoriza?: any; // cliente dueño
  cliente_autorizado?: number | null;
  taller_autorizado?: number | null;
}