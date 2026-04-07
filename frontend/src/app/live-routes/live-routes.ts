import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import { ApiService } from '../services/api.service';

interface BusItem {
  id: number;
  number: string;
}

@Component({
  selector: 'app-live-routes',
  imports: [
    CommonModule, FormsModule,
    MatProgressSpinnerModule, MatSelectModule,
    MatFormFieldModule, MatChipsModule, MatIconModule
  ],
  templateUrl: './live-routes.html',
  styleUrl: './live-routes.scss'
})
export class LiveRoutesComponent implements AfterViewInit, OnDestroy {
  private map!: L.Map;
  private routeLayers: Map<number, L.LayerGroup> = new Map();
  busList: BusItem[] = [];
  selectedBusIds: number[] = [];
  loadingList = false;
  loadingRoute = false;
  error = '';

  private colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#a65628', '#f781bf', '#1b9e77', '#d95f02', '#7570b3'];

  constructor(private api: ApiService) {}

  ngAfterViewInit() {
    this.map = L.map('live-routes-map').setView([40.4093, 49.8671], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    this.loadBusList();
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private loadBusList() {
    this.loadingList = true;
    this.api.getBusList().subscribe({
      next: (data) => {
        this.busList = data;
        this.loadingList = false;
      },
      error: () => {
        this.error = 'Could not load bus list from ayna.gov.az';
        this.loadingList = false;
      }
    });
  }

  onBusSelectionChange(selectedIds: number[]) {
    // Remove layers for deselected buses
    for (const [id, layer] of this.routeLayers) {
      if (!selectedIds.includes(id)) {
        this.map.removeLayer(layer);
        this.routeLayers.delete(id);
      }
    }

    // Add layers for newly selected buses
    for (const id of selectedIds) {
      if (!this.routeLayers.has(id)) {
        this.loadRoute(id);
      }
    }
  }

  private loadRoute(busId: number) {
    this.loadingRoute = true;
    this.api.getBusDetail(busId).subscribe({
      next: (bus) => {
        const layer = L.layerGroup().addTo(this.map);
        this.routeLayers.set(busId, layer);

        if (bus.stops && bus.stops.length > 0) {
          const colorIdx = this.selectedBusIds.indexOf(busId) % this.colors.length;
          const color = this.colors[colorIdx >= 0 ? colorIdx : 0];

          // Group stops by direction
          const forward = bus.stops
            .filter((s: any) => s.directionTypeId === 1 && s.stop?.latitude && s.stop?.longitude)
            .map((s: any) => [parseFloat(s.stop.latitude), parseFloat(s.stop.longitude)] as L.LatLngTuple);
          const backward = bus.stops
            .filter((s: any) => s.directionTypeId === 2 && s.stop?.latitude && s.stop?.longitude)
            .map((s: any) => [parseFloat(s.stop.latitude), parseFloat(s.stop.longitude)] as L.LatLngTuple);

          if (forward.length > 1) {
            L.polyline(forward, { color, weight: 4, opacity: 0.8 })
              .bindPopup(`Route ${bus.number} (Forward): ${bus.firstPoint} → ${bus.lastPoint}`)
              .addTo(layer);
          }
          if (backward.length > 1) {
            L.polyline(backward, { color, weight: 4, opacity: 0.8, dashArray: '10 5' })
              .bindPopup(`Route ${bus.number} (Return): ${bus.lastPoint} → ${bus.firstPoint}`)
              .addTo(layer);
          }

          // Add stop markers
          for (const stop of bus.stops) {
            if (stop.stop?.latitude && stop.stop?.longitude) {
              L.circleMarker(
                [parseFloat(stop.stop.latitude), parseFloat(stop.stop.longitude)],
                { radius: 4, color, fillColor: '#fff', fillOpacity: 1, weight: 2 }
              ).bindPopup(`<strong>${stop.stopName}</strong><br>Route ${bus.number}`)
                .addTo(layer);
            }
          }

          // Fit map to show selected route
          const allCoords = [...forward, ...backward];
          if (allCoords.length > 0) {
            this.map.fitBounds(L.latLngBounds(allCoords), { padding: [30, 30] });
          }
        }
        this.loadingRoute = false;
      },
      error: () => {
        this.error = `Could not load route for bus ${busId}`;
        this.loadingRoute = false;
      }
    });
  }

  clearAll() {
    this.selectedBusIds = [];
    for (const [, layer] of this.routeLayers) {
      this.map.removeLayer(layer);
    }
    this.routeLayers.clear();
    this.map.setView([40.4093, 49.8671], 11);
  }
}
