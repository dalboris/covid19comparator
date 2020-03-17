#!/usr/bin/python3
#

import datetime
import json
from pathlib import Path

data_dir = Path("data")
ecdc_files = [x for x in data_dir.iterdir() if str(x.name).startswith("ecdc")]
ecdc_files.sort()
ecdc_csv = ecdc_files[-1].read_text()

data = {}
for line in ecdc_csv.splitlines()[1:]:
    row = line.split(',')
    date = datetime.datetime.strptime(row[0], '%m/%d/%Y').date().isoformat()
    region = row[1]
    new_cases = row[2]
    new_deaths = row[3]
    # some rows have missing data, we assume zero
    if new_cases == "":
        new_cases = 0
    if new_deaths == "":
        new_deaths = 0
    if not region in data:
        init_region_data = {
            "new_cases": {},
            "new_deaths": {}
        }
        data[region] = init_region_data
    data[region]["new_cases"][date] = int(new_cases)
    data[region]["new_deaths"][date] = int(new_deaths)

json_file = data_dir / "data.json"
json_file.write_text(json.dumps(data, ensure_ascii=False))
