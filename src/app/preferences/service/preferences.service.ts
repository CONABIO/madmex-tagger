import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  constructor(public http: HttpClient) {}

  getTrainingSets() {
    return new Promise(resolve => {
      this.http.get(`${environment.serverUrl}/catalogtrainingset`).subscribe(
        data => {
          resolve(data ? data : []);
        },
        err => {
          console.log(err);
        }
      );
    });
  }

  getSquares(trainingSet: number) {
    return new Promise(resolve => {
      this.http.get(`${environment.serverUrl}/square/${trainingSet}`).subscribe(
        data => {
          console.log('Cuadros', data);
          resolve(data ? data : {});
        },
        err => {
          console.log(err);
        }
      );
    });
  }
}
