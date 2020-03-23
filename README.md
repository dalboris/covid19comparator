# covid19comparator

A website to compare cases and/or deaths of covid19 between countries

The data is copyright 2020 Johns Hopkins University, all rights reserved, and
is provided to the public strictly for educational and academic research
purposes. See:

https://github.com/CSSEGISandData/COVID-19

The source code of the website itself is licensed under the MIT license.

# How to update data?

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

This writes the static website to a subfolder named `covid19generator` of the
host. You may want to modify `deploy_production.sh` to fit your environment.
