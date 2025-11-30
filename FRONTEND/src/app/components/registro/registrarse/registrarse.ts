import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'; // si vas a usar [(ngModel)]
import { RegistroUsuarioService } from '../../../services/usuarios/registro/registro-usuario.service';
import { FormTalleres } from "../form-talleres/form-talleres";
import { FormClientes } from "../form-clientes/form-clientes";

@Component({
  selector: 'app-registrarse',
  imports: [FormTalleres, FormClientes,CommonModule],
  templateUrl: './registrarse.html',
  styleUrl: './registrarse.css'
})
export class Registrarse {
  vistaActual: 'login' | 'register' = 'register';
  tipoRegistro: 'cliente'| 'taller'| null = null;

  constructor(private router: Router) {

  }

  showLogin() {
    this.router.navigate(['/login']);
  }
  seleccionarTipoRegistro(tipo: 'cliente'|'taller') { 
    this.tipoRegistro = tipo; 
    console.log('registro tipo: ' + this.tipoRegistro); 
  }
 
}

