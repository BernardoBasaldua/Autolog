import { Taller } from "../talleres/taller.model";
import { Vehiculo } from "../vehiculo/vehiculo.model";
import { PermisoDeAcceso } from "../permisos/permiso-acceso.model";

export interface UsuarioModel {
  pk?: number;              // opcional → lo asigna el backend
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;        // opcional si después no lo usás
  dni: string;
  telefono: string;
  direccion: string;
}

export interface ClienteModel {
  id: number;
  usuario: UsuarioModel;
  permisos_que_otorgo?: PermisoDeAcceso[];  
  mis_vehiculos?: Vehiculo[];               // propios
  vehiculos_externos?: Vehiculo[];          // externos (nuevos en el serializer)
}

export interface ClienteCreatePayload {
  usuario: UsuarioModel;
  permisos_que_otorgo?: PermisoDeAcceso[];  
  mis_vehiculos?: Vehiculo[];               // propios
  vehiculos_externos?: Vehiculo[];          // externos (nuevos en el serializer)
}


export interface AdministradorTecnicoModel  {
  id?: number;
  usuario: UsuarioModel;
  taller: number;
}

export interface ClientePublicoModel {
  id: number;
  usuario_pk: number;
  first_name: string;
  last_name: string;
  email: string;
}
