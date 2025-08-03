import { Component, inject, signal } from '@angular/core';
import { Nav } from './nav/nav';
import { NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-aside',
  standalone: true,
  imports: [Nav, CommonModule],
  templateUrl: './aside.html',
  styleUrl: './aside.css'
})
export class Aside {
  private router = inject(Router);

  // Signal para guardar el tipo de usuario
  userType = signal<'cliente' | 'taller' | null>(null);

  constructor() {
    // Actualizar el tipo de usuario cuando cambia la URL
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
}
