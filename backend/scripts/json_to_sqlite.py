"""
Convert backend/data/db.json (lowdb) into a simple SQLite file at backend/data/db.sqlite.
Creates one table per top-level collection. Each table has columns:
- id INTEGER PRIMARY KEY (if present in item)
- data TEXT (JSON blob)

Run: python backend/scripts/json_to_sqlite.py
"""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data' / 'db.json'
OUT = ROOT / 'data' / 'db.sqlite'

if not SRC.exists():
    print('Source JSON not found:', SRC)
    raise SystemExit(1)

payload = json.loads(SRC.read_text(encoding='utf-8'))
conn = sqlite3.connect(OUT)
cur = conn.cursor()

for collection, items in payload.items():
    table = collection
    # create table
    cur.execute(f'CREATE TABLE IF NOT EXISTS "{table}" (id INTEGER PRIMARY KEY, data TEXT)')
    # optional: clear existing rows
    cur.execute(f'DELETE FROM "{table}"')
    # insert items
    for item in items or []:
        item_id = item.get('id') if isinstance(item, dict) else None
        cur.execute(f'INSERT INTO "{table}" (id, data) VALUES (?, ?)', (item_id, json.dumps(item, ensure_ascii=False)))

conn.commit()
conn.close()
print('Wrote SQLite DB to', OUT)
