# Ayna Bus Task

A 3-page web application for visualizing regional demographics, bus registration data, and live bus routes in Baku, Azerbaijan.

## Architecture

- **Backend**: Python Flask API
- **Frontend**: Angular with Angular Material + Leaflet maps

## Pages

1. **Regional Demographics Map** - Interactive map displaying population and jobs data with Micro/Meso/Macro region toggle
2. **Bus Registration & Volume Analytics** - Sortable/filterable table of bus check-in data
3. **Live Route Visualization** - Map overlay of active bus routes scraped from map.ayna.gov.az

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

> **NixOS note**: You need libstdc++ available for shapely. Set before running:
> ```bash
> export LD_LIBRARY_PATH=/nix/store/22nxhmsfcv2q2rpkmfvzwg2w5z1l231z-gcc-13.3.0-lib/lib:$LD_LIBRARY_PATH
> ```

### Frontend

```bash
cd frontend
npm install
```

## Running

### Option 1: Start script

```bash
./start.sh
```

### Option 2: Manual

Terminal 1 (backend):
```bash
source backend/venv/bin/activate
python backend/app.py
```

Terminal 2 (frontend):
```bash
cd frontend
npx ng serve
```

- Backend: http://localhost:5000
- Frontend: http://localhost:4200

## Data Sources

- `data/zone_attributes_synthetic.gpkg` - GeoPackage with 1689 zones (population, jobs, Micro/Meso/Macro regions)
- `data/ceck_in_buss.csv` - Bus check-in records (date, hour, route, counts, operator)
- Live routes scraped from https://map.ayna.gov.az
