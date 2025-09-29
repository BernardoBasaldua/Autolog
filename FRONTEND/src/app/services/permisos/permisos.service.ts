import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  
  constructor(private http: HttpClient){}

  getTalleresAutorizados(clienteId: number, vehiculoId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/clientes/${clienteId}/talleres_autorizados/?vehiculo_id=${vehiculoId}`);
  }

}