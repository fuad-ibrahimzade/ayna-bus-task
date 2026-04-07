import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getZones(level: string, type: string): Observable<any> {
    const params = new HttpParams().set('level', level).set('type', type);
    return this.http.get(`${this.baseUrl}/zones`, { params });
  }

  getBusData(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params = params.set(key, filters[key]);
    });
    return this.http.get(`${this.baseUrl}/bus-data`, { params });
  }

  getBusList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/bus-list`);
  }

  getBusDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/bus/${id}`);
  }
}
