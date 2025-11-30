export interface Taller {
    id?: number;
    nombre: string;
    descripcion?: string;
    telefono: string;
    direccion: string;
    cuit: string;
    horarioAtencion: string[]; // Formato "HH:mm - HH:mm"
}

export interface RegistroTecnicoTaller {
    usuario:{
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
    taller:{id?: number;
        nombre: string;
        descripcion?: string;
        telefono: string;
        direccion: string;
        cuit: string;
        horarioAtencion?: string[]; // Formato "HH:mm - HH:mm"
    } 
}