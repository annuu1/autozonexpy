import json
import csv

def load_tickers_from_json(filepath: str) -> list:
    with open(filepath, 'r') as f:
        return json.load(f)

def load_tickers_from_csv(filepath: str) -> list:
    with open(filepath, 'r') as f:
        reader = csv.reader(f)
        return [row[0] for row in reader if row]
