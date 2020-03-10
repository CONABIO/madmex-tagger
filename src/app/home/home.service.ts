import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  constructor(public http: HttpClient) {}

  getAgriculturaData(ts: number, sq: number) {
    return new Promise(resolve => {
      this.http.get(`${environment.serverUrl}/polygon/${ts}/${sq}`).subscribe(
        data => {
          resolve(data ? data : []);
        },
        err => {
          console.log(err);
        }
      );
    });
  }

  getCatCultivos() {
    return new Promise(resolve => {
      this.http.get(`${environment.serverUrl}/labels/50`).subscribe(
        data => {
          console.log('Cultivos', data);
          resolve(data ? data : {});
        },
        err => {
          console.log(err);
        }
      );
    });
  }

  getUsers() {
    return new Promise(resolve => {
      this.http.get('http://snmb.conabio.gob.mx:3008/v1/users').subscribe(
        data => {
          console.log('Users', data);
          resolve(data ? data : []);
        },
        err => {
          console.log(err);
        }
      );
    });
  }

  updatePoligono(polygon_id: string, params: any) {
    return new Promise(resolve => {
      this.http
        // tslint:disable-next-line:max-line-length
        .put(`http://snmb.conabio.gob.mx:3008/v1/update_poligono/${encodeURIComponent(polygon_id)}`, params)
        .subscribe(
          data => {
            resolve(true);
          },
          err => {
            console.log(err);
          }
        );
    });
  }
}
