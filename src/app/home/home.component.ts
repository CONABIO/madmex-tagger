import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

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

  constructor(private quoteService: QuoteService, private homeService: HomeService) {
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  ngOnInit() {
    this.isLoading = true;
    this.quoteService
      .getRandomQuote({ category: 'dev' })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.initMap();
        })
      )
      .subscribe((quote: string) => {
        this.quote = quote;
      });
    this.homeService
      .getCatCultivos()
      .then(data => {
        this.polygonTypeList = data;
      })
      .catch(error => console.log(error));
  }

  initMap() {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: environment.mapbox.style
    });

    this.map.on('load', async () => {
      // this.map.resize();
      try {
        /*this.polygons = await this.homeService.getAgriculturaData();
        const features = this.polygons.map(p => {
          return {
            type: 'Feature',
            geometry: p.the_geom,
            properties: {
              training_set: p.training_set,
              interpreted: p.interpreted,
              institution_id: p.institution_id,
              interpret_tag_id: p.interpret_tag_id,
              user_id: p.user_id
            }
          };
        });

        const geojson = {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features
          }
        }*/

        const geojson = await this.getPolygons();
        console.log('Hola', geojson);

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
            'line-color': ['case', ['match', ['get', 'interpreted'], 'zzzz', true, false], '#888', '#9B042B'],
            'line-width': 1
          }
        });

        this.map.on('click', 'polygon-fill', e => {
          this.map.fitBounds(turf.bbox(e.features[0].geometry), {
            padding: 50
          });
          const properties = e.features[0].properties;
          this.currentPolygon = properties;
        });
      } catch (error) {
        console.log(error);
      }
    });
  }

  async getPolygons() {
    let geojson = {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    };

    try {
      this.polygons = await this.homeService.getAgriculturaData();
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

      geojson = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      };

      return geojson;
    } catch (error) {
      console.log(error);
      return geojson;
    }
  }

  tagPolygon() {
    const params = {
      interpreted: 1,
      institution_id: 1,
      user_id: 1,
      interpret_tag_id: this.polygonType
    };

    this.resetTagger();
    /*this.homeService.updatePoligono(this.currentPolygon.id, params).then(data => {
      console.log('Poligono etiquetado');
      this.resetTagger();
    }).catch(error => {
      console.log(error);
    });*/
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
