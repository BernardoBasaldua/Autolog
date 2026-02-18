import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Taller } from '../../../models/talleres/taller.model';
import { TalleresService } from '../../../services/talleres/talleres.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cli-talleres.html',
  styleUrl: './cli-talleres.css'
})
export class CliTalleres implements OnInit {
  talleres: Taller[] = [];

  constructor(private router: Router, private talleresService: TalleresService) {}

  ngOnInit(): void {
    this.talleresService.getTalleres().subscribe(data => this.talleres = data);
  }

  pedirTurno(taller: Taller) {
    this.router.navigate(['/cliente', 'talleres', taller.id, 'pedir_turno']);
  }

  terminoBusqueda: string = '';

  get talleresFiltrados() {
    const termino = this.terminoBusqueda.toLowerCase().trim();

    if (!termino) return this.talleres;

    return this.talleres.filter(t =>
      t.nombre.toLowerCase().includes(termino) ||
      (t.descripcion ?? '').toLowerCase().includes(termino)
    );
  }


}
