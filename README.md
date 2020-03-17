# covid19comparator

A website to compare cases and/or deaths of covid19 between countries

# Prerequisites

Ubuntu 18.04.

```
sudo apt install unoconv # xls to csv conversion
```

# How to update data?

Assuming we are on 2020-03-16, first make sure that the ECDC data for this day is available at:

https://www.ecdc.europa.eu/en/publications-data/download-todays-data-geographic-distribution-covid-19-cases-worldwide

Then, run the following:

```
./scrape_data.sh 2020-03-16
./jsonify_data.py
```

This populates the `data` folder with a new `csv` file and a `data.json` file
which will be automatically embedded within the final `covid19.js`.

# How to generate the website?

This combines `src/`, which is using simpler test data, with the actual data
from `data/`, and write the result as a static website in a new folder `out/`
(it is overwritten if it already exists).

```
./generate.py
```

# How to deploy the website?

This project assumes you deploy to an Apache server.

If you fork this project, you should first modify `src/.htaccess` to fit your
environment.

Then, define an SSH host called `covid19generator` in your `.ssh/config` file.

Finally, run:

```
./deploy_production.sh
```

This writes the static website to a subfolder named `covid19generator` of the
host. You may want to modify `deploy_production.sh` to fit your environment.
