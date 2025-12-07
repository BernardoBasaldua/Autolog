
import { Injectable, signal } from '@angular/core';
import { Marca, MarcaCreatePayload, ModeloCreatePayload, Vehiculo, VehiculoCreatePayload } from '../../models/vehiculo/vehiculo.model';
import { Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = 'http://127.0.0.1:8000/api/';
  private apiVehiculosUrl = 'http://127.0.0.1:8000/api/vehiculo/';
  private apiMarcasUrl = 'http://127.0.0.1:8000/api/marca/';
  private apiModelosUrl = 'http://127.0.0.1:8000/api/modelo/';
  vehiculos = signal<Vehiculo[]>([]);
  marcas = signal<Marca[]>([]);

  constructor(private http: HttpClient, private auth:AuthService){}

  listarTodos(): Observable<Vehiculo[]> {
    const url = `${this.apiVehiculosUrl}`;
    return this.http.get<Vehiculo[]>(url).pipe(
      tap(v => {
        this.vehiculos.set(v);
        console.log('vehiculos:', v);
      })
    );
  } 

  getMarcasYModelos():Observable<Marca[]> {
    const url = `${this.apiUrl}marca/`;
    return this.http.get<Marca[]>(url).pipe(
      tap(marcas => {
        this.marcas.set(marcas);
        console.log('marcas:', marcas);
      })
    );
  }

  getVehiculoById(id: number): Observable<Vehiculo | undefined> {
    const vehiculo = this.vehiculos().find(v => v.id === id);
    return of(vehiculo);
  }

  crearVehiculo(vehiculo: VehiculoCreatePayload): Observable<any> {
    return this.http.post<VehiculoCreatePayload>(this.apiVehiculosUrl, vehiculo).pipe(
      tap(() => {
        this.listarTodos().subscribe();
      })
    );
  }

  crearMarca(marca: MarcaCreatePayload): Observable<any> {
    return this.http.post<MarcaCreatePayload>(this.apiMarcasUrl, marca).pipe(
      tap(() => {
        this.listarTodos().subscribe();
      })
    );
  }

  crearModelo(modelo: ModeloCreatePayload): Observable<any> {
    return this.http.post<ModeloCreatePayload>(this.apiModelosUrl, modelo).pipe(
      tap(() => {
        this.listarTodos().subscribe();
      })
    );
  }

}
