import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TalleresService } from '../../../../services/talleres/talleres.service';
import { Taller } from '../../../../models/talleres/taller.model';
import { Turno } from '../../../../models/turnos/turno.model';

@Component({
  selector: 'app-cli-pedir-turno',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cli-p_turno.html',
  styleUrl: './cli-p_turno.css'
})
export class CliPedirTurno {
  tallerId: number;
  taller: any;

  constructor(private router: Router, private talleresService: TalleresService) {
    const url = this.router.url;
    const parts = url.split('/');
    this.tallerId = parseInt(parts[parts.length - 2], 10); // Obtener el ID del taller desde la URL
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    console.log(`Pedir turno para el taller: ${this.tallerId}`);

    this.talleresService.getTallerById(this.tallerId).subscribe(taller => {
      if (taller) {
        console.log(`Taller encontrado: ${taller.nombre}`);
        this.taller = taller;

        //Una vez que el taller está cargado, generamos los turnos
        this.generarTurnos(
          taller.horarioAtencion[0],
          taller.horarioAtencion[1],
          taller.horarioAtencion[2]
        );
      } else {
        console.log('Taller no encontrado');
      }
    });
  }
  turnosDisponibles: { fecha: string, hora: string }[] = [];

  generarTurnos(dia: string, desde: string, hasta: string) {
    const turnos = [];
    const fecha = '2025-08-25';
    const inicio = this.convertirHoraADate(desde, fecha);
    const fin = this.convertirHoraADate(hasta, fecha);
    const intervaloMinutos = 60;
    let turnoId = 1;

    for (let horaActual = new Date(inicio); horaActual < fin; horaActual.setMinutes(horaActual.getMinutes() + intervaloMinutos)) {
      const horaStr = horaActual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      turnos.push({
        id: turnoId++,
        fecha: fecha,
        hora: horaStr,
      });
    }

    this.turnosDisponibles = turnos;
  }

  convertirHoraADate(hora: string, fecha: string): Date {
    const [h, m] = hora.split(':').map(Number);
    const date = new Date(fecha);
    date.setHours(h, m, 0, 0);
    return date;
  }

  seleccionarTurno(taller: Taller, turno: { fecha: string, hora: string }) {
    console.log(`Turno seleccionado: Fecha: ${turno.fecha}, Hora: ${turno.hora}`);
    // Aquí podrías navegar a otra página o realizar alguna acción con el turno seleccionado
    // this.router.navigate(['/cliente', 'confirmar_turno', this.tallerId, turno.fecha, turno.hora]);
    this.router.navigate(['/cliente', 'talleres', taller.id, 'pedir_turno', turno.fecha, 'seleccionar']);
  }
}
