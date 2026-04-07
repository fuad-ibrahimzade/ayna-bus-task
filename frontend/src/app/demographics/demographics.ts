import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as L from 'leaflet';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-demographics',
  imports: [CommonModule, MatButtonToggleModule, MatProgressSpinnerModule],
  templateUrl: './demographics.html',
  styleUrl: './demographics.scss'
})
export class DemographicsComponent implements OnInit, AfterViewInit, OnDestroy {
  private map!: L.Map;
  private geoLayer?: L.GeoJSON;
  level = 'macro';
  dataType = 'population';
  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.map = L.map('demographics-map').setView([40.4093, 49.8671], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    this.loadData();
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  onLevelChange(level: string) {
    this.level = level;
    this.loadData();
  }

  onDataTypeChange(type: string) {
    this.dataType = type;
    this.loadData();
  }

  private loadData() {
    this.loading = true;
    this.api.getZones(this.level, this.dataType).subscribe({
      next: (geojson) => {
        if (this.geoLayer) this.map.removeLayer(this.geoLayer);

        const values = geojson.features.map((f: any) => f.properties[this.dataType] || 0);
        const maxVal = Math.max(...values, 1);
        const minVal = Math.min(...values, 0);

        this.geoLayer = L.geoJSON(geojson, {
          style: (feature) => {
            const val = feature?.properties[this.dataType] || 0;
            const ratio = (val - minVal) / (maxVal - minVal || 1);
            return {
              fillColor: this.getColor(ratio),
              weight: 1,
              opacity: 0.7,
              color: '#555',
              fillOpacity: 0.7
            };
          },
          onEachFeature: (feature, layer) => {
            const p = feature.properties;
            const name = p.name || p.meso || `Zone ${p.zone_id}`;
            layer.bindPopup(`
              <strong>${name}</strong><br>
              Population: ${(p.population || 0).toLocaleString()}<br>
              Jobs: ${(p.jobs || 0).toLocaleString()}
            `);
          }
        }).addTo(this.map);

        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private getColor(ratio: number): string {
    if (this.dataType === 'population') {
      const r = Math.round(255 * ratio);
      const g = Math.round(100 * (1 - ratio));
      const b = Math.round(150 * (1 - ratio));
      return `rgb(${r},${g},${b})`;
    } else {
      const r = Math.round(50 * (1 - ratio));
      const g = Math.round(100 * (1 - ratio));
      const b = Math.round(200 + 55 * ratio);
      return `rgb(${r},${g},${b})`;
    }
  }
}
