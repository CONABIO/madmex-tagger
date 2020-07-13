import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

import { QuoteService } from './quote.service';
import * as mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

import { environment } from '@env/environment';
import { HomeService } from './home.service';

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
  polygonTypeMap: any = {};
  polygonType: any = null;
  selectedPolygons: Array<number> = [];

  square: number = null;
  trainingSet: number = null;

  minTagValue = 0;

  constructor(private _route: ActivatedRoute, private homeService: HomeService) {
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  ngOnInit() {
    this._route.params.subscribe(async data => {
      this.trainingSet = data.trainingset;
      this.square = data.square;

      try {
        this.polygonTypeList = await this.homeService.getCatCultivos();
        this.polygonTypeList = this.polygonTypeList.sort();
        this.polygonTypeList.forEach(element => {
          this.polygonTypeMap[element.id] = element.value;
        });
        this.initMap();
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
    // console.log('selected', this.selectedPolygons);
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
            /*'fill-color': 'rgba(255, 255, 255,0.5)',*/
            'fill-color': [
              'case',
              ['==', ['get', 'automatic_label_tag_id'], 0 + this.minTagValue],
              '#009900',
              ['==', ['get', 'automatic_label_tag_id'], 1 + this.minTagValue],
              '#00CC00',
              ['==', ['get', 'automatic_label_tag_id'], 2 + this.minTagValue],
              '#00FF00',
              ['==', ['get', 'automatic_label_tag_id'], 3 + this.minTagValue],
              '#009999',
              ['==', ['get', 'automatic_label_tag_id'], 4 + this.minTagValue],
              '#00CC99',
              ['==', ['get', 'automatic_label_tag_id'], 5 + this.minTagValue],
              '#00FF99',
              ['==', ['get', 'automatic_label_tag_id'], 6 + this.minTagValue],
              '#0099CC',
              ['==', ['get', 'automatic_label_tag_id'], 7 + this.minTagValue],
              '#00CCCC',
              ['==', ['get', 'automatic_label_tag_id'], 8 + this.minTagValue],
              '#00FFCC',
              ['==', ['get', 'automatic_label_tag_id'], 9 + this.minTagValue],
              '#999900',
              ['==', ['get', 'automatic_label_tag_id'], 10 + this.minTagValue],
              '#99CC00',
              ['==', ['get', 'automatic_label_tag_id'], 11 + this.minTagValue],
              '#99FF00',
              ['==', ['get', 'automatic_label_tag_id'], 12 + this.minTagValue],
              '#99FFCC',
              '#888'
            ],
            'fill-opacity': 0.6
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

        this.map.addLayer({
          id: 'polygon-original-class',
          type: 'symbol',
          source: 'polygons-src',
          minzoom: 14.8,
          filter: ['has', 'interpret_tag_id'],
          layout: {
            'text-field': '{interpret_tag_id}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 14
          },
          paint: {
            'text-color': '#E05A07'
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

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });

        this.map.on('mouseenter', 'polygon-fill', e => {
          this.map.getCanvas().style.cursor = 'pointer';

          const description = e.features[0].properties.interpret_tag_id;

          if (description.length) {
            const center = turf.center(e.features[0].geometry);
            const coordinates = center.geometry.coordinates.slice();

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            popup
              .setLngLat(coordinates)
              .setHTML(description)
              .addTo(this.map);
          }
        });

        this.map.on('mouseleave', 'polygon-fill', () => {
          this.map.getCanvas().style.cursor = '';
          popup.remove();
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
      // console.log('Poligonos', this.polygons);
      const tags = [...new Set(this.polygons.map(p => p.automatic_label_tag_id).sort())];
      this.minTagValue = tags.length ? Number(tags[0]) : 0;
      // console.log('min', this.minTagValue);
      // console.log('Tags', [...tags].join(','));
      const features = this.polygons.map(p => {
        return {
          type: 'Feature',
          geometry: p.the_geom,
          properties: {
            id: p.tob_id,
            training_set: p.training_set,
            interpreted: p.interpreted,
            institution_id: p.institution_id,
            interpret_tag_id: p.interpret_tag_id ? this.polygonTypeMap[p.interpret_tag_id] : '',
            user_id: p.user_id,
            automatic_label_tag_id: p.automatic_label_tag_id
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

      this.map.removeFeatureState({
        source: 'polygons-src'
      });

      const bbox = turf.bbox(geojson.data);
      this.map.fitBounds(bbox, {
        padding: 20
      });

      this.polygonType = null;
      this.currentPolygon = null;
      this.selectedPolygons = [];
    } catch (error) {
      console.log(error);
    }
  }
}
