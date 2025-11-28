// aside.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';

import { Nav } from './nav/nav';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { ClienteModel } from '../../../models/usuarios/usuario.model';

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

  // contexto de la UI según la URL
  userType = signal<'cliente' | 'taller' | null>(null);

  // datos del cliente
  cliente = signal<ClienteModel | null>(null);

  constructor() {
    //la URL para saber en qué "modo" está la UI
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = this.router.url;
        if (url.startsWith('/cliente')) {
          this.userType.set('cliente');
        } else if (url.startsWith('/taller')) {
          this.userType.set('taller');
        } else {
          this.userType.set(null);
        }
      }
    });
  }

  ngOnInit(): void {
    // traigo los datos del cliente al cargar el layout
    this.clienteService.getMiCliente().subscribe({
      next: (c) => {
        this.cliente.set(this.clienteService.clienteActual())
        //this.cliente.set(c);
        console.log('Cliente en aside:', c);
      },
      error: (e) => {
        console.error('Error cargando cliente en aside', e);
      }
    });
  }
}
