// import { Component } from '@angular/core';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-ta-detail',
//   imports: [],
//   templateUrl: './ta-detail.html',
//   styleUrl: './ta-detail.css'
// })
// export class TaDetail {
//   constructor(private router: Router) {}

//   verTurnos() {
//     console.log('Ver turnos');
//     this.router.navigate(['/taller', 'turnos']);
//   }

//   crearNuevaOrden() {
//     console.log('Crear nueva orden');
//     this.router.navigate(['/taller', 'ordenes', 'nueva']);
//   }
// }
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { TurnoService } from '../../../../services/turnos/turno.service';
import { Turno } from '../../../../models/turnos/turno.model';

@Component({
  selector: 'app-ta-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ta-detail.html',
})
export class TaDetail implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private turnoService = inject(TurnoService);

  agendaId = 0;
  fechaStr = ''; // YYYY-MM-DD
  hora = 0;

  cargando = false;
  errorMsg = '';

  turnosSlot: Turno[] = [];

  // Modales
  modalAdd = false;
  modalEdit = false;
  modalDelete = false;

  // Selección
  turnoSeleccionado: Turno | null = null;

  // Campos simples de ejemplo
  nuevoServicio = '';
  editServicio = '';

  ngOnInit(): void {
    this.agendaId = Number(this.route.snapshot.paramMap.get('agendaId') || 0);
    this.fechaStr = String(this.route.snapshot.paramMap.get('fecha') || '');
    this.hora = Number(this.route.snapshot.paramMap.get('hora') || 0);

    this.cargarTurnosSlot();
  }

  cargarTurnosSlot(): void {
    this.cargando = true;
    this.errorMsg = '';

    this.turnoService.getTurnosAgenda(this.agendaId).subscribe({
      next: (all) => {
        this.turnosSlot = (all || []).filter((t) => {
          const ft = new Date(t.fecha_turno);
          const ymd = ft.toISOString().split('T')[0];
          return ymd === this.fechaStr && ft.getHours() === this.hora;
        });
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se pudieron cargar los turnos del horario.';
        this.turnosSlot = [];
        this.cargando = false;
      }
    });
  }

  // ====== UI ======
  labelHora(h: number): string {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr12 = ((h + 11) % 12) + 1;
    return `${hr12}:00 ${ampm}`;
  }

  get rangoHorario(): string {
    return `${this.labelHora(this.hora)} - ${this.labelHora(this.hora + 1)}`;
  }

  get fechaBonita(): string {
    const d = new Date(`${this.fechaStr}T00:00:00`);
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }

  // ====== Navegación ======
  verTurnos(): void {
    this.router.navigate(['/taller', 'turnos']);
  }

  crearNuevaOrden(): void {
    this.router.navigate(['/taller', 'ordenes', 'nueva'], {
      queryParams: { agendaId: this.agendaId, fecha: this.fechaStr, hora: this.hora }
    });
  }

  // ====== Modales ======
  abrirAdd(): void {
    this.nuevoServicio = '';
    this.modalAdd = true;
  }
  cerrarAdd(): void { this.modalAdd = false; }

  abrirEdit(t: Turno): void {
    this.turnoSeleccionado = t;
    this.editServicio = (t as any).servicio ?? (t as any).mantenimiento ?? t.mantenimiento ?? '';
    this.modalEdit = true;
  }
  cerrarEdit(): void {
    this.modalEdit = false;
    this.turnoSeleccionado = null;
  }

  abrirDelete(t: Turno): void {
    this.turnoSeleccionado = t;
    this.modalDelete = true;
  }
  cerrarDelete(): void {
    this.modalDelete = false;
    this.turnoSeleccionado = null;
  }

  // ====== Acciones (conectar “en serio” después) ======
  guardarNuevo(): void {
    // Acá después llamás a crear OT. Por ahora solo cerramos.
    this.modalAdd = false;
  }

  guardarEdicion(): void {
    // Acá después PATCH/PUT a la OT.
    this.modalEdit = false;
  }

  confirmarDelete(): void {
    if (!this.turnoSeleccionado?.id) return;

    this.turnoService.deleteTurno(this.turnoSeleccionado.id).subscribe({
      next: () => {
        this.cerrarDelete();
        this.cargarTurnosSlot();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se pudo eliminar el turno.';
        this.cerrarDelete();
      }
    });
  }

  // Helpers para mostrar mejor (si tu backend no trae nombre/patente todavía)
  vehiculoLabel(t: Turno): string {
    return (t as any).vehiculo_nombre
      || (t as any).vehiculo?.dominio
      || (t as any).vehiculo?.patente
      || `Vehículo #${(t as any).vehiculo}`;
  }

  servicioLabel(t: Turno): string {
    return (t as any).servicio || t.mantenimiento || '—';
  }
}