import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  constructor(public http: HttpClient) { }

  getAgriculturaData() {

    return new Promise(resolve => {
      this.http.get('http://snmb.conabio.gob.mx:3008/v1/poligono/agricultura').subscribe(
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
      this.http.get('http://snmb.conabio.gob.mx:3008/v1/madmextag/agricultura').subscribe(
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
      .put(`http://snmb.conabio.gob.mx:3008/v1/update_poligono/${polygon_id}`, params)
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
