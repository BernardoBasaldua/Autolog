// cliente.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ClienteCreatePayload, ClienteModel, UsuarioModel } from '../../../models/usuarios/usuario.model';
import { PermisoDeAcceso } from '../../../models/permisos/permiso-acceso.model';

import { Observable, map, tap, switchMap, of } from 'rxjs';
import { Vehiculo } from '../../../models/vehiculo/vehiculo.model';
import { AuthService } from '../../auth/auth.service';
import { ClientePublicoModel } from '../../../models/usuarios/usuario.model';


@Injectable({ providedIn: 'root' })
export class ClienteService {
  private apiClientesUrl = 'http://127.0.0.1:8000/api/clientes/';
  

  // estado en memoria
  clienteActual = signal<ClienteModel | null>(null);
  mis_vehiculos = signal<Vehiculo[]>([]);
  vehiculos_autorizados = signal<Vehiculo[]>([]);
  clientes = signal<ClienteModel[]>([]);
  

  constructor(private http: HttpClient) {}

    // PARA REGISTRAR NUEVO CLIENTE
  crearCliente(usuario:UsuarioModel): Observable<ClienteModel> {
    //this.usuario = usuario;
    const cliente: ClienteCreatePayload = {usuario};
    const url = this.apiClientesUrl;
    return this.http.post<ClienteModel>(url, cliente);
  }


  getClientesPublicos(): Observable<ClientePublicoModel[]> {
  return this.http.get<ClientePublicoModel[]>(`http://127.0.0.1:8000/api/clientes/publicos/`);
}

  /** Devuelve el cliente asociado al usuario logueado */
  getMiCliente(): Observable<ClienteModel> {
    // ClienteViewSet hace filter(usuario=request.user) si no es staff o super user,
    // así que GET /api/clientes/ debería devolver una LISTA con 1 elemento.
    return this.http.get<ClienteModel[]>(this.apiClientesUrl).pipe(
      tap(listaCliente => {
        const cliente = listaCliente[0];

        this.clientes.set(listaCliente);
        this.clienteActual.set(cliente);
        this.mis_vehiculos.set(cliente.mis_vehiculos ?? []);
        this.vehiculos_autorizados.set(cliente.vehiculos_externos ?? []);
        console.log('client en MEMORIA:', cliente);
      }),
      map(listaCliente => listaCliente[0])  // me quedo con el primer (y único) cliente
    );
  }

   /** Devuelve todos los cliente si staf true */
  listarTodos(): Observable<ClienteModel[]> {
    // ClienteViewSet hace filter(usuario=request.user) si no es staff o super user,
    // así que GET /api/clientes/ debería devolver una LISTA con 1 elemento.
    return this.http.get<ClienteModel[]>(this.apiClientesUrl).pipe(
      tap(listaClientes => {
        const clientes = listaClientes;

        this.clientes.set(listaClientes);
        console.log('client en MEMORIA:', clientes);
      }),
     
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

  getPermisosOtorgados(clienteId: number): Observable<PermisoDeAcceso[]> {
  return this.http.get<PermisoDeAcceso[]>(`${this.apiClientesUrl}${clienteId}/acceso/`);
}

  crearPermiso(permiso: PermisoDeAcceso, clienteId: number): Observable<PermisoDeAcceso> {
    return this.http.post<PermisoDeAcceso>(`${this.apiClientesUrl}${clienteId}/acceso/`, permiso);
  }

  eliminarPermiso(clienteId: number, permisoId: number): Observable<void> {
    const url = `${this.apiClientesUrl}${clienteId}/eliminar_permiso/?permiso_id=${permisoId}`;
    return this.http.delete<void>(url);
  }

  }
