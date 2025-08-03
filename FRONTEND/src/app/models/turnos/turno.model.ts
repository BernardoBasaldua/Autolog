import { Taller } from "../talleres/taller.model";
import { Vehiculo } from "../vehiculo/vehiculo.model";

export interface Turno {
    id: number;
    vehiculo: Vehiculo;
    taller: Taller;
    fecha: string; // Fecha del turno
    hora: string; // Formato "HH:mm"
    //estado: 'pendiente' | 'confirmado' | 'cancelado'; 
    referente: string;// Estado del turno
}
