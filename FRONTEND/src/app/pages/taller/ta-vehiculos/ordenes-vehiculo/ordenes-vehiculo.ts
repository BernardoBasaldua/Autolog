import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { OrdenService } from '../../../../services/ordenes/orden.service';
import { OrdenDeTrabajo } from '../../../../models/orden/orden.models';

import { TalleresService } from '../../../../services/talleres/talleres.service';
import { Vehiculo } from '../../../../models/vehiculo/vehiculo.model';

@Component({
  selector: 'app-ordenes-vehiculo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ordenes-vehiculo.html',
})
export class OrdenesVehiculoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  private ordenService = inject(OrdenService);
  private talleresService = inject(TalleresService);

  vehiculoId!: number;
  tecnicoId = 1; // TODO: sacarlo del auth

  vehiculo: Vehiculo | null = history.state?.vehiculo ?? null;

  historial: OrdenDeTrabajo[] = [];
  cargando = true;
  errorMsg = '';

  // caches
  talleresById = signal<Map<number, any>>(new Map());
  clientesById = signal<Map<number, any>>(new Map());

  ngOnInit(): void {
    this.vehiculoId = Number(this.route.snapshot.paramMap.get('vehiculoId'));

    const vehiculo$ = this.vehiculo
      ? of(this.vehiculo)
      : this.talleresService.getVehiculoById(this.vehiculoId).pipe(
          catchError((err) => {
            console.warn('No pude traer el vehículo', err);
            return of(null);
          })
        );

    forkJoin({
      vehiculo: vehiculo$,

      ordenes: this.ordenService
        .getOrdenesPorVehiculo(this.tecnicoId, this.vehiculoId)
        .pipe(catchError(() => of([] as OrdenDeTrabajo[]))),

      talleres: this.http
        .get<any[]>('http://127.0.0.1:8000/api/talleres/')
        .pipe(catchError(() => of([]))),

      clientes: this.http
        .get<any[]>('http://127.0.0.1:8000/api/clientes/')
        .pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ vehiculo, ordenes, talleres, clientes }) => {
        this.vehiculo = vehiculo;
        this.historial = ordenes ?? [];

        const tMap = new Map<number, any>();
        (talleres ?? []).forEach((t) => tMap.set(Number(t.id), t));
        this.talleresById.set(tMap);

        const cMap = new Map<number, any>();
        (clientes ?? []).forEach((c) => cMap.set(Number(c.id), c));
        this.clientesById.set(cMap);

        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se pudieron cargar las órdenes del vehículo.';
        this.cargando = false;
      },
    });
  }

  volver(): void {
    this.router.navigate(['/taller/vehiculos']);
  }

  // ===== TALLER =====
  tallerNombre(id: number | null | undefined): string {
    if (!id) return '-';
    const t = this.talleresById().get(Number(id));
    return t?.nombre ?? `Taller #${id}`;
  }

  // ===== CLIENTE =====
  clienteNombreApellido(id: number | null | undefined): string {
    if (!id) return '-';
    const c = this.clientesById().get(Number(id));
    if (!c) return `Cliente #${id}`;

    const first = c?.usuario?.first_name ?? '';
    const last = c?.usuario?.last_name ?? '';
    const full = `${first} ${last}`.trim();
    return full || `Cliente #${id}`;
  }
}