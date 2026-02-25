import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehiculoService } from '../../../../services/vehiculo/vehiculo.service';
import { ClienteService } from '../../../../services/usuarios/clientes/cliente.service';
import { HistorialModel, Vehiculo } from '../../../../models/vehiculo/vehiculo.model';
import { TalleresService } from '../../../../services/talleres/talleres.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './historial.html',
  styleUrls: ['./historial.css']   
})

export class Historial implements OnInit {
  clienteService = inject(ClienteService);
  private tallerService = inject(TalleresService);
  talleresSig = this.tallerService.listaTalleres;
  mis_vehiculos = this.clienteService.mis_vehiculos;
  historial : HistorialModel[] = [];

  vehiculoId: number;
  vehiculos : Vehiculo[];
  vehiculo : Vehiculo | null = null;
  

  constructor(private router: Router, private vehiculoService: VehiculoService) {
    const url = this.router.url;
    const parts = url.split('/');
    this.vehiculoId = parseInt(parts[parts.length - 1], 10);
    this.vehiculos = this.mis_vehiculos();
  }

  ngOnInit(): void {
    const cliente = this.clienteService.clienteActual();

    const propios = cliente?.mis_vehiculos ?? [];
    const externos = cliente?.vehiculos_externos ?? [];

    const todos = [...propios, ...externos];

    this.vehiculo = todos.find(v => v.id === this.vehiculoId) ?? null;
    this.historial = this.vehiculo?.historial ?? [];
    this.tallerService.getTalleres().subscribe({
    next: (talleres) => this.tallerService.listaTalleres.set(talleres),
    });
  }

  tallerNombre(tallerId: number | null): string {
    if (!tallerId) return '-';
    const t = this.talleresSig().find(x => x.id === tallerId);
    return t?.nombre ?? `Taller #${tallerId}`;
  }
}
