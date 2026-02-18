// import { Component, OnInit, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TurnoService } from '../../../services/turnos/turno.service';
// import { Turno } from '../../../models/turnos/turno.model';

// @Component({
//   selector: 'app-cli-turnos',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './cli-turnos.html',
//   styleUrl: './cli-turnos.css'
// })
// export class CliTurnos implements OnInit {
//   // pestañas
//   activeTab = signal<'turnos' | 'sugerido'>('turnos');

//   // estado de datos
//   turnos = signal<Turno[]>([]);
//   loading = signal<boolean>(false);
//   error = signal<string | null>(null);

//    // filtro por vehículo
//   // 'todos' = sin filtro, si no es un número de vehículo
//   vehiculoSeleccionado = signal<'todos' | number>('todos');

//   // lista filtrada en función del vehículo seleccionado
//   turnosFiltrados = computed(() => {
//     const sel = this.vehiculoSeleccionado();
//     const all = this.turnos();

//     if (sel === 'todos') {
//       return all;
//     }
//     return all.filter(t => t.vehiculo === sel);
//   });

//   constructor(private turnoService: TurnoService) {}

//   ngOnInit(): void {
//     this.cargarTurnos();
//   }

//   setTab(tab: 'turnos' | 'sugerido') {
//     this.activeTab.set(tab);
//   }

//   private cargarTurnos(): void {
//     this.loading.set(true);
//     this.error.set(null);

//     this.turnoService.getHistorialTodos().subscribe({
//       next: (data) => {
//         // data es el JSON que te devuelve el back
//         this.turnos.set(data);
//         this.loading.set(false);
//       },
//       error: (err) => {
//         const msg = err?.error?.mensaje || 'Error al cargar el historial de órdenes.';
//         this.error.set(msg);
//         this.loading.set(false);
//       }
//     });
//   }

//   // vehículos distintos que aparecen en los turnos (para poblar el select)
//   vehiculosUnicos(): number[] {
//     const ids = this.turnos().map(t => t.vehiculo);
//     return Array.from(new Set(ids));
//   }

//   // handler del cambio en el <select>
//   onVehiculoChange(event: Event): void {
//     const value = (event.target as HTMLSelectElement).value;
//     if (value === 'todos') {
//       this.vehiculoSeleccionado.set('todos');
//     } else {
//       this.vehiculoSeleccionado.set(Number(value));
//     }
//   }
// }

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnoService } from '../../../services/turnos/turno.service';
import { Turno } from '../../../models/turnos/turno.model';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Component({
  selector: 'app-cli-turnos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cli-turnos.html',
  styleUrl: './cli-turnos.css'
})
export class CliTurnos implements OnInit {

  // pestañas
  activeTab = signal<'turnos' | 'sugerido'>('turnos');

  vehiculosById = signal<Map<number, any>>(new Map());
  clientesById  = signal<Map<number, any>>(new Map());
  talleresById  = signal<Map<number, any>>(new Map());


  // datos
  turnos = signal<Turno[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // filtro por vehículo
  vehiculoSeleccionado = signal<'todos' | number>('todos');

  // filtro por fecha (nuevo)
  filtroFecha = signal<'todas' | 'futuras'>('futuras');

  // turnos filtrados combinando ambos filtros
  turnosFiltrados = computed(() => {
    const all = this.turnos();
    const vehiculo = this.vehiculoSeleccionado();
    const fechaFiltro = this.filtroFecha();

    let lista = all;

    // 1. filtro por vehículo
    if (vehiculo !== 'todos') {
      lista = lista.filter(t => t.vehiculo === vehiculo);
    }

    // 2. filtro por fechas futuras
    if (fechaFiltro === 'futuras') {
      const hoy = new Date();
      lista = lista.filter(t => {
        const fechaTurno = new Date(t.fecha_turno as any); // usar fecha_turno o fecha_entrega
        return fechaTurno >= hoy;
      });
    }

    return lista;
  });

  constructor(private turnoService: TurnoService, private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarTurnos();
  }

  setTab(tab: 'turnos' | 'sugerido') {
    this.activeTab.set(tab);
  }

  // private cargarTurnos(): void {
  //   this.loading.set(true);
  //   this.error.set(null);

  //   this.turnoService.getHistorialTodos().subscribe({
  //     next: (data) => {
  //       this.turnos.set(data);
  //       this.loading.set(false);
  //     },
  //     error: (err) => {
  //       const msg = err?.error?.mensaje || 'Error al cargar el historial de órdenes.';
  //       this.error.set(msg);
  //       this.loading.set(false);
  //     }
  //   });
  // }
  esOrdenFutura(turno: Turno): boolean {
    // IMPORTANTE: usá la fecha que define si es “futura”.
    // Para turnos, lo más lógico es fecha_turno.
    const fecha = new Date(turno.fecha_turno as any);
    return fecha.getTime() >= Date.now();
  }

  cancelarOrden(turno: Turno): void {
    // Seguridad extra: si no es futura, no hace nada
    if (!this.esOrdenFutura(turno)) return;

    const ok = confirm(`¿Cancelar la orden #ORD-${turno.id}?`);
    if (!ok) return;

    this.loading.set(true);
    this.error.set(null);

    this.turnoService.deleteTurno(turno.id).subscribe({
      next: () => {
        // Sacarla de la lista en el front
        this.turnos.set(this.turnos().filter(t => t.id !== turno.id));
        this.loading.set(false);
      },
      error: (err) => {
        console.log('DELETE error completo:', err);
        const msg =
          err?.error?.mensaje ||
          err?.error?.detail ||
          `Error ${err?.status}: ${err?.statusText || 'DELETE falló'}`;
        this.error.set(msg);
        this.loading.set(false);
      }

    });
    console.log('Turno a eliminar:', turno);
    console.log('ID que mando:', turno.id);

  }


  private cargarTurnos(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      turnos: this.turnoService.getHistorialTodos(),
      vehiculos: this.http.get<any[]>('http://127.0.0.1:8000/api/vehiculo/').pipe(catchError(() => of([]))),
      clientes: this.http.get<any[]>('http://127.0.0.1:8000/api/clientes/').pipe(catchError(() => of([]))),
      talleres: this.http.get<any[]>('http://127.0.0.1:8000/api/talleres/').pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ turnos, vehiculos, clientes, talleres }) => {
        this.turnos.set(turnos);

        const vMap = new Map<number, any>();
        (vehiculos ?? []).forEach(v => vMap.set(Number(v.id), v));
        this.vehiculosById.set(vMap);

        const cMap = new Map<number, any>();
        (clientes ?? []).forEach(c => cMap.set(Number(c.id), c));
        this.clientesById.set(cMap);

        const tMap = new Map<number, any>();
        (talleres ?? []).forEach(t => tMap.set(Number(t.id), t));
        this.talleresById.set(tMap);

        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.mensaje || 'Error al cargar el historial de órdenes.';
        this.error.set(msg);
        this.loading.set(false);
    }

    
    

  });
}
  
    // ===== VEHÍCULO =====
  vehiculoMarca(id: number): string {
    const v = this.vehiculosById().get(Number(id));
    return v?.marca?.nombre ?? `Vehículo #${id}`;
  }

  vehiculoDominio(id: number): string {
    const v = this.vehiculosById().get(Number(id));
    return v?.dominio ?? '-';
  }

  vehiculoDisplay(id: number): string {
    const v = this.vehiculosById().get(Number(id));
    if (!v) return `Vehículo #${id}`;

    const marca = v?.marca?.nombre ?? '';
    const dominio = v?.dominio ?? '-';

    return `${marca} (${dominio})`.trim();
  }

  vehiculoDisplay2(id: number): string {
    const v = this.vehiculosById().get(Number(id));
    if (!v) return `Vehículo #${id}`;

    const marca =
      v?.marca?.nombre ?? v?.marca?.nombre_marca ?? v?.marca ?? '';

    const modelo =
      v?.modelo?.nombre ?? v?.modelo?.nombre_modelo ?? v?.modelo ?? '';

    const patente =
      v?.patente ?? v?.dominio ?? '-';

    const nombre = `${marca} ${modelo}`.trim();
    return nombre ? `${nombre} - ${patente}` : `Vehículo #${id} - ${patente}`;
  }

  // ===== CLIENTE =====
  clienteNombreApellido(id: number): string {
    const c = this.clientesById().get(Number(id));
    if (!c) return `Cliente #${id}`;

    const first = c?.usuario?.first_name ?? '';
    const last  = c?.usuario?.last_name ?? '';

    const full = `${first} ${last}`.trim();
    return full || `Cliente #${id}`;
  }

  // ===== TALLER =====
  tallerNombre(id: number): string {
    const t = this.talleresById().get(Number(id));
    return t?.nombre ?? `Taller #${id}`;
  }







  // vehículos únicos para el select
  vehiculosUnicos(): number[] {
    const ids = this.turnos().map(t => t.vehiculo);
    return Array.from(new Set(ids));
  }

  // handler select vehículo
  onVehiculoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'todos') {
      this.vehiculoSeleccionado.set('todos');
    } else {
      this.vehiculoSeleccionado.set(Number(value));
    }
  }

  // handler select filtro de fecha
  onFechaFiltroChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'todas' | 'futuras';
    this.filtroFecha.set(value);
  }
}
