import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './permisos.html',
  styleUrls: ['./permisos.css']   
})

export class Permisos implements OnInit {
  vehiculoId: number;
  vehiculo: any;
  filtro: string = '';

  constructor(private router: Router) {
    const url = this.router.url;
    const parts = url.split('/');
    this.vehiculoId = parseInt(parts[parts.length - 1], 10);
  }
  
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }


}
