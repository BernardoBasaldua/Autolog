import { Vehiculo } from "../vehiculo/vehiculo.model";
import { ClienteModel } from "../usuarios/usuario.model";
import { Taller } from "../talleres/taller.model";

export interface PermisoDeAcceso {
  id?: number;
  fecha_autorizacion?: string;
  vehiculo_autorizado: Vehiculo;
  autoriza?: any; // cliente dueño
  cliente_autorizado?: number;
  taller_autorizado?: Taller;
}