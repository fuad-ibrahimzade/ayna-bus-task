import csv
import json
import os
import sqlite3

import requests
from flask import Flask, jsonify, request, send_from_directory
from shapely import wkb
from shapely.geometry import shape
from shapely.ops import unary_union

STATIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist', 'frontend', 'browser')

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='')

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
GPKG_PATH = os.path.join(DATA_DIR, 'zone_attributes_synthetic.gpkg')
CSV_PATH = os.path.join(DATA_DIR, 'ceck_in_buss.csv')

ZONE_TABLE = 'zone_attributes_synthetic '


def parse_gpkg_geom(blob):
    if blob is None:
        return None
    if blob[:2] != b'GP':
        return None
    flags = blob[3]
    envelope_type = (flags >> 1) & 0x07
    envelope_sizes = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}
    envelope_size = envelope_sizes.get(envelope_type, 0)
    header_size = 8 + envelope_size
    wkb_data = blob[header_size:]
    geom = wkb.loads(wkb_data)
    return geom.__geo_interface__


def read_csv_data():
    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    for row in rows:
        row['Date'] = row['Date'][:10]
        for col in ['Total Count', 'By SmartCard', 'By QR', 'Number Of Busses']:
            row[col] = int(row[col]) if row.get(col) else 0
        row['Hour'] = int(row['Hour']) if row.get('Hour') else 0
    return rows


@app.route('/api/zones')
def get_zones():
    level = request.args.get('level', 'macro').lower()
    if level not in ('micro', 'meso', 'macro'):
        return jsonify({'error': 'level must be micro, meso, or macro'}), 400

    level_col = level.upper()
    conn = sqlite3.connect(GPKG_PATH)
    c = conn.cursor()

    if level == 'micro':
        c.execute(f'SELECT geom, zone_id, MICRO, MESO, MACRO, tot_jobs, population FROM "{ZONE_TABLE}"')
        features = []
        for row in c.fetchall():
            geom_json = parse_gpkg_geom(row[0])
            if geom_json:
                s = shape(geom_json).simplify(0.001, preserve_topology=True)
                features.append({
                    'type': 'Feature',
                    'geometry': s.__geo_interface__,
                    'properties': {
                        'zone_id': row[1], 'micro': row[2], 'meso': row[3],
                        'macro': row[4], 'jobs': row[5], 'population': row[6],
                    }
                })
    else:
        c.execute(f'SELECT geom, {level_col}, tot_jobs, population FROM "{ZONE_TABLE}"')
        groups = {}
        for row in c.fetchall():
            key = row[1]
            if key not in groups:
                groups[key] = {'geoms': [], 'jobs': 0, 'population': 0}
            geom_json = parse_gpkg_geom(row[0])
            if geom_json:
                groups[key]['geoms'].append(shape(geom_json))
            groups[key]['jobs'] += row[2] or 0
            groups[key]['population'] += row[3] or 0

        features = []
        for key, data in groups.items():
            if not data['geoms']:
                continue
            merged = unary_union(data['geoms']).simplify(0.002, preserve_topology=True)
            features.append({
                'type': 'Feature',
                'geometry': merged.__geo_interface__,
                'properties': {
                    'name': key,
                    'jobs': data['jobs'],
                    'population': data['population'],
                }
            })

    conn.close()
    return jsonify({'type': 'FeatureCollection', 'features': features})


@app.route('/api/bus-data')
def get_bus_data():
    rows = read_csv_data()

    route_filter = request.args.get('route')
    operator_filter = request.args.get('operator')

    if route_filter:
        rows = [r for r in rows if str(r['Route']) == route_filter]
    if operator_filter:
        rows = [r for r in rows if r['Operator'] == operator_filter]

    # Sorting
    sort_by = request.args.get('sort', 'Date')
    sort_dir = request.args.get('dir', 'asc')
    if rows and sort_by in rows[0]:
        rows.sort(key=lambda r: r[sort_by], reverse=(sort_dir == 'desc'))

    total = len(rows)
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    page_rows = rows[(page - 1) * per_page: page * per_page]

    all_rows = read_csv_data()
    all_routes = sorted(set(str(r['Route']) for r in all_rows))
    all_operators = sorted(set(r['Operator'] for r in all_rows))

    return jsonify({
        'data': page_rows,
        'total': total,
        'page': page,
        'per_page': per_page,
        'routes': all_routes,
        'operators': all_operators,
    })


AYNA_API = 'https://map-api.ayna.gov.az/api'


@app.route('/api/bus-list')
def get_bus_list():
    try:
        resp = requests.get(f'{AYNA_API}/bus/getBusList', timeout=10)
        if resp.ok:
            return jsonify(resp.json())
        return jsonify({'error': 'Failed to fetch bus list'}), 502
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 502


@app.route('/api/bus/<int:bus_id>')
def get_bus_detail(bus_id):
    try:
        resp = requests.get(f'{AYNA_API}/bus/getBusById', params={'id': bus_id}, timeout=10)
        if resp.ok:
            return jsonify(resp.json())
        return jsonify({'error': 'Failed to fetch bus details'}), 502
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 502


@app.route('/')
@app.route('/<path:path>')
def serve_frontend(path=''):
    if path and os.path.exists(os.path.join(STATIC_DIR, path)):
        return send_from_directory(STATIC_DIR, path)
    return send_from_directory(STATIC_DIR, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', '1') == '1'
    app.run(host='0.0.0.0', port=port, debug=debug)
