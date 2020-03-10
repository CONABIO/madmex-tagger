import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

import { QuoteService } from './quote.service';
import * as mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

import { environment } from '@env/environment';
import { HomeService } from './home.service';
import { geojsonType } from '@turf/turf';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  quote: string | undefined;
  isLoading = false;

  map: mapboxgl.Map;
  lat = 23.549;
  lng = -101.676;
  zoom: 4.64;

  users: any = [];
  polygons: any = [];
  currentPolygon: any = null;
  polygonTypeList: any = [];
  polygonType: any = null;
  selectedPolygons: Array<number> = [];

  square: number = null;
  trainingSet: number = null;

  constructor(private _route: ActivatedRoute, private homeService: HomeService) {
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  ngOnInit() {
    this._route.params.subscribe(async data => {
      this.trainingSet = data.trainingset;
      this.square = data.square;

      this.initMap();

      try {
        this.polygonTypeList = await this.homeService.getCatCultivos();
      } catch (error) {
        console.log(error);
      }
    });
  }

  updateSelectedPolygons(id: number, remove?: boolean) {
    if (remove) {
      const index = this.selectedPolygons.indexOf(id);
      this.selectedPolygons.splice(index, 1);
    } else {
      this.selectedPolygons.push(id);
    }
    console.log('selected', this.selectedPolygons);
  }

  initMap() {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: environment.mapbox.style
    });

    this.map.on('load', async () => {
      try {
        const geojson = await this.getPolygons();

        const bbox = turf.bbox(geojson.data);
        console.log('bbox', bbox);

        this.map.addSource('polygons-src', geojson);
        this.map.fitBounds(bbox, {
          padding: 20
        });
        this.map.addLayer({
          id: 'polygon-fill',
          type: 'fill',
          source: 'polygons-src',
          paint: {
            'fill-color': 'rgba(255, 255, 255,0.5)',
            'fill-opacity': 0.3
          }
        });

        this.map.addLayer({
          id: 'pol',
          type: 'line',
          source: 'polygons-src',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'interpreted'], true],
              '#9B042B',
              ['boolean', ['feature-state', 'selected'], false],
              '#fcf003',
              '#888'
            ],
            'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 4, 2]
          }
        });

        this.map.on('click', 'polygon-fill', e => {
          this.map.fitBounds(turf.bbox(e.features[0].geometry), {
            padding: 200
          });

          const properties = e.features[0].properties;
          this.currentPolygon = properties;

          if (!properties.interpreted) {
            const fs = this.map.getFeatureState({
              source: 'polygons-src',
              id: e.features[0].id
            });

            if (fs.selected) {
              this.map.removeFeatureState({
                source: 'polygons-src',
                id: e.features[0].id
              });
              this.updateSelectedPolygons(properties.id, true);
            } else {
              this.map.setFeatureState(
                {
                  source: 'polygons-src',
                  id: e.features[0].id
                },
                {
                  selected: true
                }
              );
              this.updateSelectedPolygons(properties.id);
            }
          }
        });
      } catch (error) {
        console.log(error);
      }
    });
  }

  async getPolygons() {
    const geojson = {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      generateId: true
    };

    try {
      this.polygons = await this.homeService.getAgriculturaData(this.trainingSet, this.square);
      const features = this.polygons.map(p => {
        return {
          type: 'Feature',
          geometry: p.the_geom,
          properties: {
            id: p.tob_id,
            training_set: p.training_set,
            interpreted: p.interpreted,
            institution_id: p.institution_id,
            interpret_tag_id: p.interpret_tag_id,
            user_id: p.user_id
          }
        };
      });

      geojson.data.features = features;

      return geojson;
    } catch (error) {
      console.log(error);
      return geojson;
    }
  }

  tagPolygon() {
    const params = {
      interpreted: true,
      institution_id: 1,
      user_id: 1,
      interpret_tag_id: this.polygonType
    };

    // this.resetTagger();
    this.homeService
      .updatePoligono(this.selectedPolygons.join(','), params)
      .then(data => {
        console.log('Poligono etiquetado');
        this.resetTagger();
      })
      .catch(error => {
        console.log(error);
      });
  }

  async resetTagger() {
    try {
      const geojson = await this.getPolygons();
      this.map.getSource('polygons-src').setData(geojson.data);

      const bbox = turf.bbox(geojson.data);
      this.map.fitBounds(bbox, {
        padding: 20
      });

      this.polygonType = null;
      this.currentPolygon = null;
    } catch (error) {
      console.log(error);
    }
  }
}
