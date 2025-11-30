// aside.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';

import { Nav } from './nav/nav';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { TalleresService } from '../../../services/talleres/talleres.service';
import { switchMap } from 'rxjs/operators';
import { AdminTecService } from '../../../services/usuarios/adminTec/admin-tec.service';
import { UsuarioService } from '../../../services/usuarios/usuarios/usuario.service';

@Component({
  selector: 'app-aside',
  standalone: true,
  imports: [Nav, CommonModule],
  templateUrl: './aside.html',
  styleUrl: './aside.css'
})
export class Aside implements OnInit {
  private router = inject(Router);
  private clienteService = inject(ClienteService);
  private tallerService = inject(TalleresService);
  private tecnicoService = inject(AdminTecService);
  private usuarioService = inject(UsuarioService);

  // contexto de la UI según la URL
  userType = signal<'cliente' | 'taller' | null>(null);

  // datos del usuario y del taller
  cliente = this.clienteService.clienteActual;
  tecnico = this.tecnicoService.tecnicoActual;
  taller  = this.tallerService.tallerActual;
  usuario = this.usuarioService.usuarioActual;

  constructor() {
    // escuchar cambios de ruta para actualizar contexto y datos
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setUserTypeByUrl(event.urlAfterRedirects);
        this.cargarDatosSegunContexto();
      }
    });
  }

  ngOnInit(): void {
    // al iniciar, setear tipo según la URL actual y cargar datos
    this.setUserTypeByUrl(this.router.url);
    this.cargarDatosSegunContexto();
  }

  private setUserTypeByUrl(url: string) {
    if (url.startsWith('/cliente')) {
      this.userType.set('cliente');
    } else if (url.startsWith('/taller')) {
      this.userType.set('taller');
    } else {
      this.userType.set(null);
    }
  }

  private cargarDatosSegunContexto() {
    const tipo = this.userType();

    //SIEMPRE PRECARGO USUARIO
    this.usuarioService.getMiUsuario().subscribe({
        next: (usuario) => console.log('Usuario en ASIDE:', usuario),
        error: (e) => console.error('Error de carga usuario en ASIDE', e)
      });
  
    if (tipo === 'cliente') {
    //PRECARGO CLIENTE
      this.clienteService.getMiCliente().subscribe({
        next: (c) => console.log('Cliente en aside:', c),
        error: (e) => console.error('Error cargando cliente en ASIDE', e)
      });
    } else if (tipo === 'taller') {
    // PRECARGO TECNICO Y TALLER
      this.tecnicoService.getMiTecnico().pipe(
        switchMap((tec) => {
          console.log('Técnico en aside:', tec);
          const tallerId = tec.taller; //
          console.log('Buscando taller id:', tallerId);
          return this.tallerService.getTallerById(tallerId);
        })
      ).subscribe({
        next: (taller) => console.log('Taller en aside:', taller),
        error: (e) => console.error('Error cargando técnico/taller en aside', e,)
      });
    }
  }
}
