# covid19comparator

A website to compare cases and/or deaths of covid19 between countries. This
website is non-commercial and purely for educational and academic research
purposes. The data comes from the following sources:

- https://github.com/CSSEGISandData/COVID-19

  Copyright 2020 Johns Hopkins University

- https://www.worldometers.info/coronavirus/

  Copyright 2020 Worldometers.info

Thank you so much for the effort of compiling this data and making it
available. If you are a copyright holder and believe that I am infringing any
rights, please let me know at (dalboris gmail com).

# How to update data?

You need Python3 and BeautifulSoup 4:

```
pip3 install lxml
pip3 install beautifulsoup4
```

Then:

```
./scrape_data.sh
./jsonify_data.py
```

This populates the `data` folder with updated `csv` and `json` files, which
will be automatically embedded within the final `covid19.js`.

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

This writes the static website to a subfolder named `covid19generator.com` of the
host. You may want to modify `deploy_production.sh` to fit your environment.
