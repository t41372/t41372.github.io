"""Derive the committed, local star asset: python3 scripts/generate-stars.py <hygdata_v41.csv>.

Download the pinned source in docs/real-sky.md separately. Builds never fetch it.
The derived catalog remains CC BY-SA 4.0; see THIRD_PARTY_NOTICES.md.
"""
import csv
import hashlib
import io
import json
import math
from pathlib import Path
import struct
import sys

SOURCE_SHA256 = 'd9f69fd86bbf90a4e4d52b4c5c53eacfa6dfc0bfdef85bfd94f095e0bebe4ebd'
raw = Path(sys.argv[1]).read_bytes()
if hashlib.sha256(raw).hexdigest() != SOURCE_SHA256:
    raise SystemExit('Source checksum differs from the pinned HYG v4.1 catalog')

records = []
landmarks = {}
for row in csv.DictReader(io.StringIO(raw.decode('utf-8'))):
    if row['id'] == '0' or float(row['mag']) > 6.5 or float(row['dec']) < -26:
        continue
    position = [float(row[axis]) for axis in ('x', 'y', 'z')]
    distance = math.hypot(*position)
    # Position and velocity share the original distance divisor. Normalizing
    # (direction + years * velocity) at draw time preserves space motion,
    # including the catalog's radial component, without a pmRA/cos(dec) trap.
    direction = [value / distance for value in position]
    velocity = [float(row[axis]) / distance for axis in ('vx', 'vy', 'vz')]
    values = [int(row['id']), *direction, *velocity, float(row['mag']), float(row['ci']) if row['ci'] else math.nan]
    records.append((float(row['mag']), values))
    if row['proper'] in ('Polaris', 'Vega', 'Dubhe', 'Arcturus', 'Betelgeuse', 'Capella', 'Deneb', 'Shedar'):
        landmarks[row['proper']] = {'id': int(row['id']), 'hip': int(row['hip']), 'raHours': float(row['ra']), 'decDegrees': float(row['dec'])}

records.sort(key=lambda entry: (entry[0], entry[1][0]))
destination = Path(__file__).resolve().parents[1] / 'src' / 'data'
data = b''.join(struct.pack('<9f', *values) for _, values in records)
(destination / 'bright-stars.bin').write_bytes(data)
metadata = {
    'source': 'HYG v4.1 by David Nash / Astronexus',
    'sourceCommit': 'c7f7f883fe678cc7680169a50ccd7dcc49b060ce',
    'sourceSha256': SOURCE_SHA256,
    'license': 'CC-BY-SA-4.0',
    'count': len(records),
    'format': 'little-endian float32: HYG id, x, y, z, vx, vy, vz, V magnitude, B-V (NaN if unknown)',
    'coordinates': 'J2000 equatorial; unit direction, velocity divided by the same J2000 distance per Julian year',
    'selection': 'Sun excluded; V magnitude <= 6.5; declination >= -26 degrees (Fairbanks horizon with margin)',
    'sha256': hashlib.sha256(data).hexdigest(),
    'landmarks': landmarks,
}
(destination / 'bright-stars.meta.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(f'{len(records)} stars, {len(data):,} bytes; SHA-256 {metadata["sha256"]}')
