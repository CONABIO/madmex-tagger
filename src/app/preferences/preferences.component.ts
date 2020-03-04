import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { PreferencesService } from './service/preferences.service';

import * as mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

import { environment } from '@env/environment';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss']
})
export class PreferencesComponent implements OnInit {
  map: mapboxgl.Map;
  trainingSetsForm: FormGroup;
  squaresForm: FormGroup;

  trainingSets: any = [];

  constructor(private _formBuilder: FormBuilder, private _preferencesService: PreferencesService) {
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  async getSquares() {
    try {
      const squares: any = await this._preferencesService.getSquares(this.trainingSetsForm.value.trainingSet);

      const features = squares.map(s => {
        return {
          type: 'Feature',
          geometry: s.the_geom,
          properties: {
            id: s.id
          }
        };
      });

      const geojson = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      };

      const bbox = turf.bbox(geojson.data);
      console.log('bbox', bbox);
      this.map.fitBounds(bbox, {
        padding: 20
      });

      console.log('data', JSON.stringify(geojson.data));
      this.squaresForm.get('square').setValue(1);
      this.map.getSource('squares-src').setData(geojson.data);
    } catch (error) {
      console.log(error);
    }
  }

  initMap() {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: environment.mapbox.style
    });

    this.map.on('load', async () => {
      // this.map.resize();
      const geojson = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      };

      this.map.addSource('squares-src', geojson);

      this.map.addLayer({
        id: 'squares-fill',
        type: 'fill',
        source: 'squares-src',
        paint: {
          'fill-color': 'rgba(255, 255, 255,0.5)',
          'fill-opacity': 0.3
        }
      });

      this.map.addLayer({
        id: 'squares',
        type: 'line',
        source: 'squares-src',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#9B042B',
          'line-width': 10
        }
      });

      this.map.on('click', 'squares-fill', e => {
        const id = e.features[0].properties.id;
        console.log(id);
        this.squaresForm.get('square').setValue(id);
      });
    });
  }

  async ngOnInit() {
    this.trainingSetsForm = this._formBuilder.group({
      trainingSet: ['', Validators.required]
    });
    this.squaresForm = this._formBuilder.group({
      square: ['', Validators.required]
    });

    try {
      this.trainingSets = await this._preferencesService.getTrainingSets();
      console.log('ts', this.trainingSets);
    } catch (error) {
      console.log(error);
    }

    this.initMap();
  }
}
