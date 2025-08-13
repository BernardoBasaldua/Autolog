import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  vistaActual: 'login' | 'register' = 'login'; //por defecto login

  showLogin() {
    this.vistaActual = 'login';
  }

  showRegister() {
    this.vistaActual = 'register';
  } 
}
