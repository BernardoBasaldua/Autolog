import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { OrdenService } from '../../../../services/ordenes/orden.service';
import { OrdenDeTrabajo } from '../../../../models/orden/orden.models';

@Component({
  selector: 'app-ordenes-vehiculo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ordenes-vehiculo.html',
})
export class OrdenesVehiculoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ordenService = inject(OrdenService);

  vehiculoId!: number;

  historial: OrdenDeTrabajo[] = [];
  cargando = true;
  errorMsg = '';

  ngOnInit(): void {
    const vehiculoId = Number(this.route.snapshot.paramMap.get('vehiculoId'));
    const tecnicoId = 1;

    this.ordenService.getOrdenesPorVehiculo(tecnicoId, vehiculoId).subscribe({
      next: (data) => {
        this.historial = data ?? [];
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se pudieron cargar las órdenes del vehículo.';
        this.cargando = false;
      }
    });
  }

}
