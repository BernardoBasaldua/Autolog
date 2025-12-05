// cliente.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ClienteModel, UsuarioModel } from '../../../models/usuarios/usuario.model';
import { PermisoDeAcceso } from '../../../models/permisos/permiso-acceso.model';

import { Observable, map, tap, switchMap } from 'rxjs';



@Injectable({ providedIn: 'root' })
export class ClienteService {
  private apiClientesUrl = 'http://127.0.0.1:8000/api/clientes/';
  private apiTalleresUrl = 'http://127.0.0.1:8000/api/talleres/';

  // estado en memoria
  clienteActual = signal<ClienteModel | null>(null);

  constructor(private http: HttpClient) {}

    // PARA REGISTRAR NUEVO CLIENTE
  crearCliente(usuario:UsuarioModel): Observable<ClienteModel> {
    //this.usuario = usuario;
    const cliente: ClienteModel = {usuario};
    const url = this.apiClientesUrl;
    return this.http.post<ClienteModel>(url, cliente);
  }

  /** Devuelve el cliente asociado al usuario logueado */
  getMiCliente(): Observable<ClienteModel> {
    // ClienteViewSet hace filter(usuario=request.user) si no es staff o super user,
    // así que GET /api/clientes/ debería devolver una LISTA con 1 elemento.
    return this.http.get<ClienteModel[]>(this.apiClientesUrl).pipe(
      tap(listaCliente => {
        this.clienteActual.set(listaCliente[0]);
        console.log('client en MEMORIA:', listaCliente[0]);
      }),
      map(listaCliente => listaCliente[0])  // me quedo con el primer (y único) cliente
    );
  }

    /** Elimina el CLIENTE actual: DELETE /api/clientes/<id>/ */
  eliminarCuenta(): Observable<void> {
    const actual = this.clienteActual();

    // Si ya tenemos el cliente cargado en memoria, usamos ese id
    if (actual && actual.id) {        // si tu modelo usa "pk", cambiá a actual.pk
      const url = `${this.apiClientesUrl}${actual.id}/`;   // → http://127.0.0.1:8000/api/clientes/1/
      return this.http.delete<void>(url);
    }

    // Si clienteActual es null, primero lo pedimos al backend
    return this.getMiCliente().pipe(
      switchMap(cliente => {
        if (!cliente.id) {           // si es pk, cambiá a cliente.pk
          throw new Error('El cliente no tiene id definido');
        }
        const url = `${this.apiClientesUrl}${cliente.id}/`;
        return this.http.delete<void>(url);
      })
    );
  }

  crearPermiso(permiso: PermisoDeAcceso, vehiculoId: number): Observable<void> {
    // ahora recibís el id del vehículo como argumento
    const url = `${this.apiClientesUrl}${vehiculoId}/acceso/`;
    return this.http.post<PermisoDeAcceso>(url, permiso).pipe(
      map(() => void 0) // convierte el resultado a 'void'
    );
  }

eliminarPermiso(vehiculoId: number, permisoId: number): Observable<void> {
  // construimos la URL con el id del vehículo y el permiso_id como query param
  const url = `${this.apiClientesUrl}${vehiculoId}/eliminar_permiso/?permiso_id=${permisoId}`;
  
  return this.http.delete<void>(url).pipe(
    map(() => void 0) // convierte el resultado a 'void'
  );
}

}
