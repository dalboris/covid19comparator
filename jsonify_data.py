#!/usr/bin/python3
#

import csv
import datetime
import json
from pathlib import Path

def isUSCity(region, subregion):
    return ("," in subregion) and subregion != "Washington, D.C."

def addCategory(filename, category, data):

    with open(filename, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            region = row["Country/Region"]
            subregion = row["Province/State"]
            if region == "US":
                region = "United States"
                if isUSCity(subregion):
                    continue
            if subregion != "":
                region += " (" + subregion + ")"
            if not region in data:
                data[region] = {}
            data[region][category] = {}
            for key, value in row.items():
                if len(key.split("/")) == 3:
                    isodate = datetime.datetime.strptime(key, '%m/%d/%y').date().isoformat()
                    data[region][category][isodate] = int(value)

if __name__ == "__main__":
    data_dir = Path("data")
    cases_file = data_dir / "time_series_19-covid-Confirmed.csv"
    deaths_file = data_dir / "time_series_19-covid-Deaths.csv"
    data = {}
    addCategory(str(cases_file), "total_cases", data)
    addCategory(str(deaths_file), "total_deaths", data)
    json_file = data_dir / "data.json"
    json_file.write_text(json.dumps(data, ensure_ascii=False))
