#!/bin/bash
#

if [ "$#" -ne 1 ]; then
    echo "Usage:   ./update_data.sh <date>"
    echo "Example: ./update_data.sh 2020-03-16"
    exit 1
fi

# ECDC dataset.
# More info: https://www.ecdc.europa.eu/en/publications-data/download-todays-data-geographic-distribution-covid-19-cases-worldwide
DATE=$1
ECDC_PAGE="https://www.ecdc.europa.eu/sites/default/files/documents/"
ECDC_BASENAME="COVID-19-geographic-disbtribution-worldwide-$DATE"
ECDC_XLS="$ECDC_BASENAME.xls"
ECDC_CSV="ecdc-2020-03-16.csv"

# Dowload XLS and convert to CSV
cd data
wget "$ECDC_PAGE/$ECDC_XLS"
unoconv -o "$ECDC_CSV" -f csv "$ECDC_XLS"
