import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {
  private router = inject(Router);
  //Signal para guardar el título actual
  currentTitle = signal<string>('Inicio');

  constructor() {
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      const path = event.urlAfterRedirects;
      this.currentTitle.set(this.mapPathToTitle(path));
    })
  }
  mapPathToTitle(path: string): string {
    //Rutas a título de clientes
    if (path.startsWith('/cliente/historial')) return 'Historial';
    if (path.startsWith('/cliente/turnos')) return 'Turnos';
    if (path.startsWith('/cliente/talleres')) return 'Talleres';
    if (path.startsWith('/cliente/config')) return 'Configuración';
    if (path.startsWith('/cliente/permisos')) return 'Administración de permisos';
    if (path.startsWith('/cliente')) return 'Inicio';
    
    //Rutas a título de talleres
    if (path.startsWith('/taller/ordenes')) return 'Órdenes de trabajo';
    if (path.startsWith('/taller/clientes')) return 'Clientes';
    if (path.startsWith('/taller/vehiculos')) return 'Vehículos';
    if (path.startsWith('/taller/turnos')) return 'Agenda de turnos';
    if (path.startsWith('/taller/turnos/detalle')) return 'Detalle del turno';
    if (path.startsWith('/taller/config')) return 'Configuración';

    return 'Inicio'; // Título por defecto
  }
}
