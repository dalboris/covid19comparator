#!/usr/bin/python3
# Needs Python >= 3.6 (formatted string literals)

from bs4 import BeautifulSoup
from pathlib import Path
from socket import timeout
import csv
import datetime
import json
import re
import time
import urllib.request


def printDownloadError(error, tryagain, exception):
    print(f"Error: {error}.")
    if tryagain > 0:
        print(f"Trying again {tryagain} times.")
    else:
        raise exception


def download(url):
    tryagain = 3
    while tryagain > 0:
        tryagain -= 1;
        print("Downloading " + url + "...")
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            response = urllib.request.urlopen(url, timeout=10).read().decode('utf-8')
        except urllib.error.HTTPError as error:
            if error.code == 404:
                raise
            else:
                printDownloadError(error, tryagain, error)
        except urllib.error.URLError as error:
            printDownloadError(error, tryagain, error)
        except timeout:
            printDownloadError("Timeout", tryagain, timeout)
        else:
            response = urllib.request.urlopen(request, timeout=10)
            response_bytes = response.read()
            text = response_bytes.decode('utf-8')
            print("OK")
            return text


class JohnHopkinsDailyReport:
    def __init__(self, date, text):
        self.date = date
        self.text = text


def getJohnHopkinsDailyReports():
    reports = []
    firstdate = datetime.date(2020,1,22)
    lastdate = None
    today = datetime.date.today()
    date = firstdate
    while date <= today:
        urlfilename = f"{date:%m-%d-%Y}.csv"    # mm-dd-yyyy
        ourfilename = date.isoformat() + ".csv" # yyyy-mm-dd
        filepath = Path("data/jhu") / ourfilename
        if filepath.exists():
            text = filepath.read_text()
            reports.append(JohnHopkinsDailyReport(date, text))
            lastdate = date
        else:
            url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/" + urlfilename
            try:
                text = download(url)
                filepath.write_text(text)
                reports.append(JohnHopkinsDailyReport(date, text))
                lastdate = date
            except urllib.error.HTTPError as err:
                if err.code == 404:
                    print("John Hopkins University's daily report for " + date.isoformat() + " not available yet");
                else:
                    raise
        date += datetime.timedelta(days=1)

    assert lastdate
    assert len(reports) > 0
    print(f"Updating data using reports from {firstdate} to {lastdate}")
    return reports


# For the United states:
# - before   2020-03-10, data was: "New York County, NY",US  (only per-county data)
# - starting 2020-03-10, data was: New York,US               (only per-state data)
# - starting 2020-03-22, data is:  New York City,New York,US (only per-city data, with a special "Unassigned" city for cases/deaths in unknown city)
#
# For Canada:
# - before   2020-03-09, data was: "Toronto, ON",Canada (only per-city data)
# - starting 2020-03-09, data was: Ontario,Canada       (only per-province data)
#
# Starting 2020-03-22, the column names changed from "Country/Region" and
# "Province/State" to "Country_Region" and "Province_State", and an additional
# column "Admin2" was added for the US City. We ignore it and just sum all
# cities for each state. We also currently ignore data before 2020-03-10, as
# this would require mapping from US state code (e.g., "NY"), to US state name,
# which we didn't take the time to implement (only very few cases/deaths before
# 2020-03-10 anyway).
#
def populateDateFromJohnHopkins(date, text, data):
    if text.startswith(u'\ufeff'):
        text = text[1:] # Remove BOM if any (https://en.wikipedia.org/wiki/Byte_order_mark)
    oldformat = (date < datetime.date(2020,3,22))
    regionlabel = "Country/Region" if oldformat else "Country_Region"
    subregionlabel = "Province/State" if oldformat else "Province_State"
    reader = csv.DictReader(text.splitlines())
    totals = {}
    for row in reader:
        region = row[regionlabel]
        subregion = row[subregionlabel]
        if region == "Cruise Ship":
            region = subregion # Diamond Princess
            subregion = ""
        elif region == "Channel Islands":
            continue
        elif region in ["Bahamas, The", "Bahamas"]:
            region = "The Bahamas"
        elif region == "Denmark":
            if subregion == "":
                subregion = "Denmark"
        elif region == "France":
            if subregion == "":
                subregion = "France"
        elif "Gambia" in region:  # "Gambia", "Gambia, The"
            region = "The Gambia"
        elif region == "Germany":
            if subregion == "Bavaria":
                continue
        elif "Iran" in region: # "Iran (Islamic Republic of)"
            region = "Iran"
            subregion = ""
        elif region == "Netherlands":
            if subregion == "":
                subregion = "Netherlands"
        elif "Korea" in region: # "Korea, South", "Republic of Korea":
            region = "South Korea"
        elif region == "Mainland China":
            region = "China"
        elif region == "Austria":
            if subregion == "None":
                continue
        elif "Moldova" in region: # "Republic of Moldova"
            region = "Moldova"
        elif "Ireland" in region: # "Republic of Ireland"
            region = "Ireland"
        elif "Congo" in region:   # "Republic of the Congo"
            region = "Congo"
        elif "Russia" in region:   # "Russian Federation"
            region = "Russia"
        elif region == "Viet Nam":
            region = "Vietnam"
        elif region == "occupied Palestinian territory": # data stops on March 17 and was all 0
            continue
        elif region == "Australia":
            if subregion == "From Diamond Princess": # already counted in region == "Diamond Princess"
                continue
        elif region in ["Taiwan", "Taiwan*"] or "Taipei" in region: # "Taipei and environs"
            region = "Taiwan"
            subregion = ""
        elif region == "US":
            region = "United States"
            if date < datetime.date(2020,3,10):
                continue
            if subregion == "Virgin Islands, U.S." or subregion == "United States Virgin Islands":
                subregion = "Virgin Islands"
            elif subregion in ["US", "Recovered", "Wuhan Evacuee"]:
                continue
        elif region == "Canada":
            if "," in subregion: # old format
                continue
            if subregion in ["Grand Princess", "Recovered"]:
                continue
        elif region == "UK":
            region = "United Kingdom"
            subregion = "United Kingdom"
        elif region == "United Kingdom":
            if subregion in ["UK", ""]:
                subregion = "United Kingdom"
        if "Diamond Princess" in subregion:
            continue
        if "Hong Kong" in region or "Hong Kong" in subregion:
            region = "Hong Kong"
            subregion = ""
        if "Macao" in region or "Macao" in subregion or "Macau" in region or "Macau" in subregion:
            region = "Macau"
            subregion = ""
        if region in ["St Martin", "Saint Martin", "St. Martin"]:
            region = "St Martin"
        if region in ["Guadeloupe", "Martinique", "Mayotte", "Reunion", "Saint Barthelemy", "St Martin"]:
            subregion = region
            region = "France"
        if "Guiana" in region or "Guiana" in subregion: # Note: one of the data has a typo: "Fench Guiana"
            region = "France"
            subregion = "French Guiana"
        if subregion == "None":
            subregion = ""
        if subregion == "Cruise Ship":
            region = "Diamond Princess"
            subregion = ""
        if subregion == "French Polynesia":
            if date == datetime.date(2020,3,23): # Bug in the data: 860 deaths attributed to French Polynesia instead of France
                subregion = "France"

        numCases = 0 if row["Confirmed"] == "" else int(row["Confirmed"])
        numDeaths = 0 if row["Deaths"] == "" else int(row["Deaths"])

        if not region in totals:
            totals[region] = {}
            totals[region]["total_cases"] = 0
            totals[region]["total_deaths"] = 0
        totals[region]["total_cases"] += numCases
        totals[region]["total_deaths"] += numDeaths

        if subregion != "":
            region += " (" + subregion + ")"
            if not region in totals:
                totals[region] = {}
                totals[region]["total_cases"] = 0
                totals[region]["total_deaths"] = 0
            totals[region]["total_cases"] += numCases
            totals[region]["total_deaths"] += numDeaths

    isodate = date.isoformat()
    for region, d in totals.items():
        if not region in data:
            data[region] = {}
            data[region]["total_cases"] = {}
            data[region]["total_deaths"] = {}
        data[region]["total_cases"][isodate] = d["total_cases"]
        data[region]["total_deaths"][isodate] = d["total_deaths"]


# Note: we only use JohnHopkins for per-state/province data for Canada and the US
def populateDataFromJohnHopkins(data):
    reports = getJohnHopkinsDailyReports()
    for report in reports:
        populateDateFromJohnHopkins(report.date, report.text, data)


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
    # page in Worldometers are sometimes more up to date than the charts. The
    # United States is sometimes only partially updated for the current day,
    # and may give a false impression of "slowing down", so we skip.
    if region != "United States" and latest != values[-1]:
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
    text = download(url)
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
    populateRegionFromWorldometers("india", "India", data)
    populateRegionFromWorldometers("iran", "Iran", data)
    populateRegionFromWorldometers("iraq", "Iraq", data)
    populateRegionFromWorldometers("ireland", "Ireland", data)
    populateRegionFromWorldometers("israel", "Israel", data)
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
    populateRegionFromWorldometers("turkey", "Turkey", data)
    populateRegionFromWorldometers("uk", "United Kingdom", data)
    populateRegionFromWorldometers("us", "United States", data)


if __name__ == "__main__":
    data = {}
    populateDataFromJohnHopkins(data)
    #populateDataFromWorldometers(data)
    json_file = Path("data/data.json")
    json_file.write_text(json.dumps(data, ensure_ascii=False))
