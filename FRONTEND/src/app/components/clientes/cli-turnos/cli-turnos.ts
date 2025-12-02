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

  constructor(private turnoService: TurnoService) {}

  ngOnInit(): void {
    this.cargarTurnos();
  }

  setTab(tab: 'turnos' | 'sugerido') {
    this.activeTab.set(tab);
  }

  private cargarTurnos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.turnoService.getHistorialTodos().subscribe({
      next: (data) => {
        this.turnos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.mensaje || 'Error al cargar el historial de órdenes.';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
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
