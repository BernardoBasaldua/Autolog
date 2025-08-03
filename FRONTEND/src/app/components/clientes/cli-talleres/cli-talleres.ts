import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Taller } from '../../../models/talleres/taller.model';
import { TalleresService } from '../../../services/talleres/talleres.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cli-talleres.html',
  styleUrl: './cli-talleres.css'
})
export class CliTalleres {
  talleres: Taller[] = []

  constructor(private router: Router, private talleresService: TalleresService) {}

  ngOnInit(): void {
    this.talleresService.getTalleres().subscribe(data => this.talleres = data);
  }

  pedirTurno(taller: Taller) {
    this.router.navigate(['/cliente', 'talleres', taller.id, 'pedir_turno']);
  }
}
