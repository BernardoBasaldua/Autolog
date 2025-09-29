import { Injectable } from '@angular/core';
import { Taller } from '../../models/talleres/taller.model';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TalleresService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  private talleres: Taller[] = [];

  constructor(private http: HttpClient){}

  getTalleres(): Observable<Taller[]> {
    const url = `${this.apiUrl}/talleres`;
    return this.http.get<Taller[]>(url);
  }

  getTallerById(id: number): Observable<Taller | undefined> {
    const taller = this.talleres.find(taller => taller.id === id);
    return of(taller);
  }
}
