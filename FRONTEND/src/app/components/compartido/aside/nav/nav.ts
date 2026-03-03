import { Component, inject, signal, effect, output } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
  styleUrl: './nav.css'
})
export class Nav {
  private router = inject(Router);

  // Signal para guardar el tipo de usuario
  userType = signal<'cliente' | 'taller' | null>(null);
  
  constructor() {
    //Actualizar el tipo de usuario cuando cambia la URL
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

  navigate = output<void>();
}
