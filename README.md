# covid19comparator

A website to compare cases and/or deaths of covid19 between countries

# Prerequisites

Ubuntu 18.04.

```
sudo apt install unoconv # xls to csv conversion
```

# How to update data?

For now, it's now fully automatic. Example below for 2020-03-16. Change date accordingly.

```
cd covid19comparator
./scrape_data 2020-03-16
```
