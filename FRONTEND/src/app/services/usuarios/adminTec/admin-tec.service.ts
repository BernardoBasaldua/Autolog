import { Injectable, signal } from '@angular/core';
import { AdministradorTecnicoModel } from '../../../models/usuarios/usuario.model';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminTecService {

  private apiTecnicosUrl = 'http://127.0.0.1:8000/api/tecnicos/';
  private apiUsuariosUrl = 'http://127.0.0.1:8000/api/usuarios/';

  // estado en memoria
  tecnicoActual = signal<AdministradorTecnicoModel| null>(null);

  constructor(private http: HttpClient) {}

  /** Devuelve el cliente asociado al usuario logueado */
  getMiTecnico(): Observable<AdministradorTecnicoModel> {
    // AdministradorTecnicoViewSet hace filter(usuario=request.user),
    // así que GET /api/tecnicos/ debería devolver una LISTA con 1 elemento.
    return this.http.get<AdministradorTecnicoModel[]>(this.apiTecnicosUrl).pipe(
      tap(adminTecnico => {
        this.tecnicoActual.set(adminTecnico[0]);
        console.log('tecnico en MEMORIA:', adminTecnico[0]);
      }),
       map(adminTecnico => adminTecnico[0])  // me quedo con el primer (y único) tecnico
    );
  }


    /** Elimina el CLIENTE actual: DELETE /api/clientes/<id>/ */
  deleteTecnico(): Observable<void> {
    const actual = this.tecnicoActual();

    // Si ya tenemos el cliente cargado en memoria, usamos ese id
    if (actual && actual.id) {        // si tu modelo usa "pk", cambiá a actual.pk
      const url = `${this.apiTecnicosUrl}${actual.id}/`;   // → http://127.0.0.1:8000/api/clientes/1/
      return this.http.delete<void>(url);
    }

    // Si clienteActual es null, primero lo pedimos al backend
    return this.getMiTecnico().pipe(
      switchMap(tecnico => {
        if (!tecnico.id) {           // si es pk, cambiá a cliente.pk
          throw new Error('El cliente no tiene id definido');
        }
        const url = `${this.apiTecnicosUrl}${tecnico.id}/`;
        return this.http.delete<void>(url);
      })
    );
  }
  
}
