import { Vehiculo } from "../vehiculo/vehiculo.model";

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
  id?:number;
  usuario: UsuarioModel;
  permisos_que_otorgo?: any[]; // después los tipás bien
  mis_vehiculos?: Vehiculo[];       // idem
}
