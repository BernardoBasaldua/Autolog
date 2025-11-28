import { Injectable } from '@angular/core';
import { Taller } from '../../../models/talleres/taller.model';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ClienteModel, UsuarioModel } from '../../../models/usuarios/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class RegistroUsuarioService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  private usuario: UsuarioModel | null=null;

  constructor(private http: HttpClient){}

  crearUsuario(usuario:UsuarioModel): Observable<ClienteModel> {
    //this.usuario = usuario;
    const cliente: ClienteModel = {usuario};
    const url = `${this.apiUrl}/clientes/`;
    return this.http.post<ClienteModel>(url, cliente);
  }
}