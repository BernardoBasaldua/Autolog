import { Component } from '@angular/core';
import { FormClientes } from "../../registro/form-clientes/form-clientes";
import { FormTalleres } from "../../registro/form-talleres/form-talleres";

@Component({
  selector: 'app-ta-config',
  imports: [FormClientes, FormTalleres],
  templateUrl: './ta-config.html',
  styleUrl: './ta-config.css'
})
export class TaConfig {
  editandoPerfil = false;
  editandoUsuario= false;

  editarPerfil() { this.editandoPerfil = true; }
  volver() { this.editandoPerfil = false; }
  volver1() { this.editandoUsuario = false; }
  editarUsuario() { this.editandoUsuario= true; }
  configurarMantenimiento() { /* navegar o abrir modal */ }
  agregarEmpleado() { /* flujo crear empleado/usuario */ }
  gestionarUsuarios() { /* listado de usuarios, activar/desactivar */ }
  eliminarCuenta() { /* confirmación + llamada al backend */ }

}
