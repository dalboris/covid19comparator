#!/bin/bash
#
# Note: I got this error with unoconv once:
#
# Traceback (most recent call last):
#  File "/usr/bin/unoconv", line 1275, in <module>
#    main()
#  File "/usr/bin/unoconv", line 1189, in main
#    convertor = Convertor()
#  File "/usr/bin/unoconv", line 739, in __init__
#    unocontext = self.connect(resolver)
#  File "/usr/bin/unoconv", line 760, in connect
#    unocontext = resolver.resolve("uno:%s" % op.connection)
# uno.DisposedException: Binary URP bridge disposed during call
#
# Updating my computer and rebooting fixed the problem.
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
ECDC_XLS="$ECDC_BASENAME.xlsx"
ECDC_CSV="ecdc-$DATE.csv"

# Dowload XLS and convert to CSV
cd data
wget "$ECDC_PAGE/$ECDC_XLS"
unoconv -o "$ECDC_CSV" -f csv "$ECDC_XLS"
