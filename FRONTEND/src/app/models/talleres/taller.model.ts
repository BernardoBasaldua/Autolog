export interface Taller {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    horarioAtencion: string[]; // Formato "HH:mm - HH:mm"
    serviciosOfrecidos: string[]; // Lista de servicios que ofrece el taller
}
