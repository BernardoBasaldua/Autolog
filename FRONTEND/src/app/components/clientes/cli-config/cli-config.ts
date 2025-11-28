import { Component } from '@angular/core';
import { FormClientes } from "../../registro/form-clientes/form-clientes";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cli-config',
  standalone: true,
  imports: [FormClientes, CommonModule],
  templateUrl: './cli-config.html',
  styleUrl: './cli-config.css'
})
export class CliConfig {

  editandoPerfil = false;

  editarPerfil() {
    this.editandoPerfil = true;
    console.log('Editar perfil clickeado');
  }

  volver() {
    this.editandoPerfil = false;
  }

  eliminarCuenta() {
    const confirmar = confirm(
      '¿Seguro que querés eliminar tu cuenta? Esta acción es permanente.'
    );

    if (!confirmar) return;

    // Acá después llamás a un servicio:
    // this.usuarioService.eliminarCuenta().subscribe(...)
    console.log('Eliminar cuenta confirmado');
  }
}
