#!/usr/bin/python3
#

from bs4 import BeautifulSoup
from pathlib import Path
import csv
import datetime
import json
import re
import urllib.request

def populateCategoryFromJohnHopkins(filename, category, data):
    with open(filename, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            region = row["Country/Region"]
            subregion = row["Province/State"]
            if region == "Korea, South":
                region = "South Korea"
            if region == "US":
                region = "United States"
                if "," in subregion: # U.S City: discard
                    continue
            if subregion != "":
                region += " (" + subregion + ")"
            if not region in data:
                data[region] = {}
            data[region][category] = {}
            for key, value in row.items():
                if len(key.split("/")) == 3 and value != "":
                    isodate = datetime.datetime.strptime(key, '%m/%d/%y').date().isoformat()
                    data[region][category][isodate] = int(value)


def counterToInt(counter):
    text = counter.select_one("span").text
    text = text.strip().replace(",", "")
    return int(text)


def populateCategoryFromWorldometers(text, seriesName, region, category, latest, data):

    # Extract JavaScript Object definition
    x = re.search(
        R"Highcharts.chart\('" + seriesName + R"',(.*?)\);",
        text, flags=re.MULTILINE|re.DOTALL)

    # Convert to JSON by adding double quotes around keys, and converting all
    # single quotes to double quotes. We use a leading space before the key to
    # avoid replacing 'subtitle:' to 'sub"titlre":''.
    json_text = x.group(1)
    for key in re.findall(R"(\w*):", json_text):
        json_text = json_text.replace(" " + key + ':', ' "' + key + '":')
    json_text = json_text.replace("'", '"')

    # Convert JSON to Python
    data_ = json.loads(json_text)
    usdates = data_["xAxis"]["categories"]
    values = data_["series"][0]["data"]
    dates = [datetime.datetime.strptime(date + " 2020", '%b %d %Y').date() for date in usdates]
    assert len(dates) == len(values)

    # Insert latest data. We do this because the total indicated on top of the
    # page in Worldometers are sometimes more up to date than the charts.
    if latest != values[-1]:
        values.append(latest)
        date = dates[-1]
        date += datetime.timedelta(days=1)
        dates.append(date)

    # Populate data
    if not region in data:
        data[region] = {}
    if not category in data[region]:
        data[region][category] = {}
    for i in range(len(dates)):
        isodate = dates[i].isoformat()
        value = int(values[i])
        data[region][category][isodate] = value


def populateRegionFromWorldometers(regionurl, region, data):

    url = 'https://www.worldometers.info/coronavirus/country/' + regionurl + '/'
    print("Dowloading " + url + "...", end="")
    response = urllib.request.urlopen(url)
    response_bytes = response.read()
    text = response_bytes.decode('utf-8')
    print(" OK " + url + "...")

    soup = BeautifulSoup(text, 'lxml')
    latestTotalCases = -1
    latestTotalDeaths = -1
    for counter in soup.select("#maincounter-wrap"):
        h1 = counter.select_one("h1").text
        if "Cases" in h1:
            latestTotalCases = counterToInt(counter)
        elif "Deaths" in h1:
            latestTotalDeaths = counterToInt(counter)

    populateCategoryFromWorldometers(text, "coronavirus-cases-linear", region, "total_cases", latestTotalCases, data)
    populateCategoryFromWorldometers(text, "coronavirus-deaths-linear", region, "total_deaths", latestTotalDeaths, data)


def populateDataFromJohnHopkins(data):
    populateCategoryFromJohnHopkins("data/time_series_19-covid-Confirmed.csv", "total_cases", data)
    populateCategoryFromJohnHopkins("data/time_series_19-covid-Deaths.csv", "total_deaths", data)


def populateDataFromWorldometers(data):
    populateRegionFromWorldometers("algeria", "Algeria", data)
    populateRegionFromWorldometers("australia", "Australia", data)
    populateRegionFromWorldometers("austria", "Austria", data)
    populateRegionFromWorldometers("belgium", "Belgium", data)
    populateRegionFromWorldometers("brazil", "Brazil", data)
    populateRegionFromWorldometers("canada", "Canada", data)
    populateRegionFromWorldometers("china", "China", data)
    populateRegionFromWorldometers("china-hong-kong-sar", "China (Hong Kong)", data)
    populateRegionFromWorldometers("denmark", "Denmark", data)
    populateRegionFromWorldometers("france", "France", data)
    populateRegionFromWorldometers("germany", "Germany", data)
    populateRegionFromWorldometers("greece", "Greece", data)
    populateRegionFromWorldometers("indonesia", "Indonesia", data)
    populateRegionFromWorldometers("iran", "Iran", data)
    populateRegionFromWorldometers("iraq", "Iraq", data)
    populateRegionFromWorldometers("ireland", "Ireland", data)
    populateRegionFromWorldometers("italy", "Italy", data)
    populateRegionFromWorldometers("malaysia", "Malaysia", data)
    populateRegionFromWorldometers("netherlands", "Netherlands", data)
    populateRegionFromWorldometers("norway", "Norway", data)
    populateRegionFromWorldometers("philippines", "Philippines", data)
    populateRegionFromWorldometers("poland", "Poland", data)
    populateRegionFromWorldometers("portugal", "Portugal", data)
    populateRegionFromWorldometers("south-korea", "South Korea", data)
    populateRegionFromWorldometers("spain", "Spain", data)
    populateRegionFromWorldometers("sweden", "Sweden", data)
    populateRegionFromWorldometers("switzerland", "Switzerland", data)
    populateRegionFromWorldometers("uk", "United Kingdom", data)


if __name__ == "__main__":
    data = {}
    populateDataFromJohnHopkins(data)
    populateDataFromWorldometers(data)
    json_file = Path("data/data.json")
    json_file.write_text(json.dumps(data, ensure_ascii=False))
