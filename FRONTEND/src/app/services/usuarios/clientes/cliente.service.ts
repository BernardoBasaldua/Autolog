// cliente.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ClienteModel, UsuarioModel } from '../../../models/usuarios/usuario.model';

import { Observable, map, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private apiUrl = 'http://127.0.0.1:8000/api/clientes/';

  // estado en memoria
  clienteActual = signal<ClienteModel | null>(null);

  constructor(private http: HttpClient) {}

  /** Devuelve el cliente asociado al usuario logueado */
  getMiCliente(): Observable<ClienteModel> {
    // ClienteViewSet hace filter(usuario=request.user),
    // así que GET /api/clientes/ debería devolver una LISTA con 1 elemento.
    return this.http.get<ClienteModel[]>(this.apiUrl).pipe(
      tap(listaCliente => {
        this.clienteActual.set(listaCliente[0]);
        console.log('cliente:', listaCliente[0]);
      }),
      map(listaCliente => listaCliente[0])  // me quedo con el primer (y único) cliente
    );
  }

  actualizarCliente(usuario: UsuarioModel): Observable<ClienteModel> {
    const actual = this.clienteActual();
    if (!actual || !actual.id) {
      throw new Error('No hay clienteActual con id cargado en memoria');
    }

    const usuarioPayload: any = {
      first_name: usuario.first_name,
      last_name: usuario.last_name,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
    };

    if (usuario.password && usuario.password.trim() !== '') {
      usuarioPayload.password = usuario.password;
    }

    const clientePayload: ClienteModel = {
      id: actual.id,
      usuario: usuarioPayload,
    };

    const url = `http://127.0.0.1:8000/api/usuarios/${actual.id}/`;

    return this.http.patch<ClienteModel>(url, usuarioPayload).pipe(
      tap(clienteActualizado => {
        this.clienteActual.set(clienteActualizado);
        console.log('cliente actualizado:', clienteActualizado);
      })
    );
  }

}
