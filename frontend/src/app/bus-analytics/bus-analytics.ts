import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-bus-analytics',
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './bus-analytics.html',
  styleUrl: './bus-analytics.scss'
})
export class BusAnalyticsComponent implements OnInit, AfterViewInit {
  displayedColumns = ['Date', 'Hour', 'Route', 'Total Count', 'By SmartCard', 'By QR', 'Number Of Busses', 'Operator'];
  dataSource = new MatTableDataSource<any>();
  routes: string[] = [];
  operators: string[] = [];
  selectedRoute = '';
  selectedOperator = '';
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadData() {
    this.loading = true;
    this.api.getBusData({
      route: this.selectedRoute,
      operator: this.selectedOperator,
      per_page: 10000
    }).subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        this.routes = res.routes;
        this.operators = res.operators;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onFilterChange() {
    this.loadData();
  }
}
