
// Get a list of all regions. Example: [ "France", "Italy", "United_States_of_America" ]
//
function getAllRegions() {
    const regions = [];
    for (const region in covid19Data_) {
        if (covid19Data_.hasOwnProperty(region)) {
            regions.push(region);
        }
    }
    return regions.sort();
}

// Get a list of selected regions. Example: [ "France", "Italy" ]
//
// [
//   {
//     id: 0,
//     region: "Italy"
//   },
//   {
//     id: 1,
//     region: "France"
//   }
// ]
//
function getSelectedRegions(covid19) {
    const alreadyAddedRegions = [];
    const regions = [];
    let regionId = -1;
    covid19.selectAll(".region-select").each(function (d) {
        regionId++;
        const region = d3.select(this).property('value');
        if (alreadyAddedRegions.indexOf(region) == -1) {
            alreadyAddedRegions.push(region);
            regions.push({
                id: regionId,
                region: region
            });
        }
    });
    return regions;
}

// Given a category (e.g., "new_deaths"), and a list of regions
// (see getSelectedRegions()), get the data in the form:
//
// [
//   {
//     id: 0,
//     region: "Italy",
//     values: [ { date: <datetime>, value: 6230 }, ... ]
//   },
//   {
//     id: 1,
//     region: "France",
//     values: [ { date: <datetime>, value: 3210 }, ... ]
//   }
// ]
//
function getData(category, regions) {
    const dateParser = fromISODateString;
    const data = [];
    regions.forEach(function (d1) {
        const values = [];
        covid19Data_[d1.region].forEach(function (d2) {
            values.push({
                date: d2.date,
                value: d2[category]
            });
        });
        data.push({
            id: d1.id,
            region: d1.region,
            values: values
        });
    });
    return data;
}

// Append a drop down menu to the given parent with all given regions as
// options. Add an "onchange" event listener so that when users change their
// selection, the updateCovid19() function is called.
//
function appendRegionSelector(parent, regions) {
    const regionId = parent.selectAll(".region-selector").size();
    const tr = parent.append("table").classed("margined", true).append("tr").classed("region-selector", true);
    tr.append("td").append("svg").classed("region-color", true)
        .attr("viewBox", "0 0 40 20")
        .append("line")
            .classed("line-" + regionId, true)
            .attr("x1", 0)
            .attr("y1", 10)
            .attr("x2", 40)
            .attr("y2", 10);
    const selector = tr.append("td").append("select").classed("region-select", true);
    selector
        .on("change", updateCovid19)
        .selectAll("option")
        .data(regions)
        .enter()
        .append("option")
        .text(function(d) { return d; })
        .attr("value", function (d, i) { return d; });
    return selector;
}

// Append a date selector.
//
function appendDateSelector(parent) {
    return parent
        .append("input")
        .attr("type", "date")
        .on("change", updateCovid19);
}

function hasCategory(covid19, category) {
    return covid19.select("." + category + "-checkbox").property("checked");
}

function updateLines(covid19, category, xScale, yScale, dateFrom, dateTo, data) {
    const lineGroup = covid19.select("." + category + "-lines");
    if (hasCategory(covid19, category)) {
        lineGroup.style("visibility", "visible");

        const line = d3.line()
            .x(function(d) { return xScale(d.date); })
            .y(function(d) { return yScale(d.value); });

        const lines = lineGroup.selectAll(".line").data(data);
        lines.enter()
            .append("path")
                .attr("class", function(d) { return "line-" + d.id; })
                .classed("line", true);
        lines.exit()
            .remove();

        lineGroup.selectAll(".line").attr("d", function(d) {
            return line(d.values.filter(function (d) {
                return dateFrom <= d.date && d.date <= dateTo;
            }));
        });
    }
    else {
        lineGroup.style("visibility", "hidden");
    }
}

function maxValue(dateFilter, data) {
    let res = 0;
    data.forEach(function (d) { // For each country
        d.values.forEach(function (d) { // For each date
            if (dateFilter(d) && d.value > res) {
                res = d.value;
            }
        });
    });
    return res;
}

function updateCovid19() {

    const covid19 = d3.select("#app");

    // Data
    const regions = getSelectedRegions(covid19);
    const dailyCasesData = getData("new_cases", regions);
    const dailyDeathsData = getData("new_deaths", regions);
    const totalCasesData = getData("total_cases", regions);
    const totalDeathsData = getData("total_deaths", regions);

    // Sync
    const syncNum = covid19.select(".sync-selector input").property("value");
    const syncDateFounds = [];
    const syncDates = [];
    const syncDaysDiffs = [];
    for (let j = 0; j < regions.length; ++j) {
        let syncDate = getToday();
        let syncDateFound = false;
        totalDeathsData[j].values.forEach(function (d) {
            if (!syncDateFound && d.value > syncNum) {
                syncDateFound = true;
                syncDate = d.date;
            }
        });
        syncDateFounds.push(syncDateFound);
        syncDates.push(syncDate);
    }
    const allData = [dailyCasesData, dailyDeathsData, totalCasesData, totalDeathsData];
    syncDaysDiffs.push(0);
    for (let j = 1; j < regions.length; ++j) {
        let numDaysDiff = 0;
        if (syncDateFounds[0]) {
            if (syncDateFounds[j]) {
                numDaysDiff = computeDaysDiff(syncDates[j], syncDates[0]);
                for (let i = 0; i < allData.length; ++i) {
                    allData[i][j].values.forEach(function (d) {
                        d.date = applyDaysDiff(d.date, numDaysDiff);
                    });
                }
            }
        }
        syncDaysDiffs.push(numDaysDiff);
    }

    // Dates
    const dateParser = fromISODateString;
    dateFrom = dateParser(covid19.select(".date-selector .from").property("value"));
    dateTo = dateParser(covid19.select(".date-selector .to").property("value"));
    const dateFilter = function (d) {
            return dateFrom <= d.date && d.date <= dateTo;
    }

    // Compute max daily cases
    let maxDailyCases =  maxValue(dateFilter, dailyCasesData);
    let maxDailyDeaths = maxValue(dateFilter, dailyDeathsData);
    let maxTotalCases =  maxValue(dateFilter, totalCasesData);
    let maxTotalDeaths = maxValue(dateFilter, totalDeathsData);

    // SVG Element
    const totalWidth = covid19.node().getBoundingClientRect().width;
    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = 30;
    const marginBottom = 100;
    const width = totalWidth - marginLeft - marginRight;
    const height = width;
    const totalHeight = height + marginTop + marginBottom;
    const svg = covid19.select("svg.graph")
        .attr("viewBox", "-"
              + marginLeft + " -"
              + marginTop + " "
              + totalWidth + " "
              + totalHeight);

    // Scales
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().rangeRound([height, 0]);
    xScale.domain([dateFrom, dateTo]);
    let yMax = 0;
    if (hasCategory(covid19, "daily-cases")) {
        yMax = Math.max(yMax, maxDailyCases);
    }
    if (hasCategory(covid19, "daily-deaths")) {
        yMax = Math.max(yMax, maxDailyDeaths);
    }
    if (hasCategory(covid19, "total-cases")) {
        yMax = Math.max(yMax, maxTotalCases);
    }
    if (hasCategory(covid19, "total-deaths")) {
        yMax = Math.max(yMax, maxTotalDeaths);
    }
    yScale.domain([0, yMax]);

    // Y Axis
    const yaxis = d3.axisLeft().scale(yScale);
    svg.select(".y.axis").call(yaxis);

    // X Axis horizontal bar
    svg.select(".x-axis-domain")
        .attr("x1", 0)
        .attr("y1", height - 0.5)
        .attr("x2", width)
        .attr("y2", height - 0.5);

    // X Axis dates
    const dateDy = 40;
    for (let j = 0; j < regions.length; ++j) {
        const xScale_ = d3.scaleTime().range([0, width]);
        xScale_.domain([
            applyDaysDiff(dateFrom, -syncDaysDiffs[j]),
            applyDaysDiff(dateTo, -syncDaysDiffs[j])]);

        const xaxis = d3.axisBottom()
            .ticks(d3.timeDay.every(1))
            .tickFormat(d3.timeFormat('%b %d'))
            .scale(xScale_);

        svg.select(".x.axis-" + j)
            .attr("transform", "translate(0," + (height + j*dateDy) + ")")
            .call(xaxis)
          .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start");
    }

    // Plotted curves
    updateLines(covid19, "daily-cases", xScale, yScale, dateFrom, dateTo, dailyCasesData);
    updateLines(covid19, "daily-deaths", xScale, yScale, dateFrom, dateTo, dailyDeathsData);
    updateLines(covid19, "total-cases", xScale, yScale, dateFrom, dateTo, totalCasesData);
    updateLines(covid19, "total-deaths", xScale, yScale, dateFrom, dateTo, totalDeathsData);
}

// Convert data from:
//
// {
//   "France": {
//     "new_cases": {"2020-03-21": 1617, "2020-03-20": 1861},
//     "new_deaths": {...}
//   },
//   "Italy": {
//     "new_cases": {"2020-03-21": 5986, "2020-03-20": 5322},
//     "new_deaths": {...}
//   }
// }
//
// To:
//
// {
//   "France": [ { "date": <2020-03-20>, "new_cases": 1861, "new_deaths": ..., "total_cases": ..., "total_deaths": ... },
//               { "date": <2020-03-21>, "new_cases": 1617, "new_deaths": ..., "total_cases": ..., "total_deaths": ... } ],
//   "Italy":  [ { "date": <2020-03-20>, "new_cases": 5322, "new_deaths": ..., "total_cases": ..., "total_deaths": ... },
//               { "date": <2020-03-21>, "new_cases": 5986, "new_deaths": ..., "total_cases": ..., "total_deaths": ... } ]
// }
//
function prepareData() {

    const categories = ["total_deaths", "total_cases"];

    // Find min and max dates
    let minDate = new Date(2099, 1, 1);
    let maxDate = new Date(2019, 1, 1);
    for (const region in covid19Data_) {
        if (covid19Data_.hasOwnProperty(region)) {
            categories.forEach(function (category) {
                const values_ = covid19Data_[region][category];
                for (const dateString in values_) {
                    if (values_.hasOwnProperty(dateString)) {
                        const date = fromISODateString(dateString);
                        if (date < minDate) {
                            minDate = date;
                        }
                        if (date > maxDate) {
                            maxDate = date;
                        }
                    }
                }
            });
        }
    }
    let dateRange = [];
    for (var d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
        dateRange.push(new Date(d));
    }

    // Fill in blank data and compute dailies from totals
    for (const region in covid19Data_) {
        if (covid19Data_.hasOwnProperty(region)) {
            let lastAvailableDate = dateRange[0];
            dateRange.forEach(function (date) {
                const dateString = toISODateString(date);
                if (covid19Data_[region]["total_cases"].hasOwnProperty(dateString) &&
                    covid19Data_[region]["total_deaths"].hasOwnProperty(dateString)) {
                    lastAvailableDate = date;
                }
            });
            const regionData = [];
            let previousTotalCases = 0;
            let previousTotalDeaths = 0;
            dateRange.forEach(function (date) {
                const dateString = toISODateString(date);
                let totalCases = previousTotalCases;
                let totalDeaths = previousTotalDeaths;
                if (date <= lastAvailableDate) {
                    if (covid19Data_[region]["total_cases"].hasOwnProperty(dateString)) {
                        totalCases = covid19Data_[region]["total_cases"][dateString];
                    }
                    if (covid19Data_[region]["total_deaths"].hasOwnProperty(dateString)) {
                        totalDeaths = covid19Data_[region]["total_deaths"][dateString];
                    }
                    regionData.push({
                        date: date,
                        new_cases: totalCases - previousTotalCases,
                        new_deaths: totalDeaths - previousTotalDeaths,
                        total_cases: totalCases,
                        total_deaths: totalDeaths
                    });
                    previousTotalCases = totalCases;
                    previousTotalDeaths = totalDeaths;
                }
            });
            covid19Data_[region] = regionData;
        }
    }
}

// Convert from datetime object to yyyy-mm-dd
//
function toISODateString(date) {
    return date.toISOString().split('T')[0];
}

function fromISODateString(dateString) {
    const s = dateString.split('-');
    return new Date(Date.UTC(parseInt(s[0]), parseInt(s[1]) - 1, parseInt(s[2])));
}

function getToday() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Returns a new date by offsetting the given date by numDays.
function applyDaysDiff(date, numDays) {
    const res = new Date(date);
    res.setDate(res.getDate() + numDays);
    return res;
}

// Computes number of day from d1 to d2. Positive is d2 is after d1, negative otherwise
const ms_per_day_ = 1000 * 60 * 60 * 24;
function computeDaysDiff(d1, d2) {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / ms_per_day_);
}

function runCovid19() {

    prepareData();

    const covid19 = d3.select("#app");

    // Region selectors
    const regions = getAllRegions();
    const selector1 = appendRegionSelector(covid19, regions);
    const selector2 = appendRegionSelector(covid19, regions);
    selector1.property('value', 'United States');
    selector2.property('value', 'Italy');

    // SVG
    const svg = covid19.append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .classed("graph", true);

    // Axes
    const xAxes = svg.append("g").attr("class", "x axes");
    xAxes.append("line").attr("class", "x-axis-domain");
    xAxes.append("g").attr("class", "x axis axis-0");
    xAxes.append("g").attr("class", "x axis axis-1");
    svg.append("g").attr("class", "y axis");

    // Lines
    svg.append("g").attr("class", "daily-cases-lines");
    svg.append("g").attr("class", "daily-deaths-lines");
    svg.append("g").attr("class", "total-cases-lines");
    svg.append("g").attr("class", "total-deaths-lines");

    // Category selectors
    const csparent = covid19.append("table").classed("category-selector", true).classed("margined", true).append("tr");
    const addcs = function (category, text, checked) {
        const label = csparent.append("td").append("label");
        label.append("input")
          .attr("type", "checkbox")
          .on("change", updateCovid19)
          .classed(category + "-checkbox", true)
          .property("checked", checked);
        label.append("span").text(text);
    }
    addcs("daily-cases",  "Daily Cases", false);
    addcs("daily-deaths", "Daily Deaths", false);
    addcs("total-cases",  "Total Cases", false);
    addcs("total-deaths", "Total Deaths", true);

    // Sync selector
    const syncSelector = covid19.append("div").classed("sync-selector", true).classed("margined", true);
    syncSelector.append("p").text("Sync at ");
    syncSelector
        .append("input")
        .attr("type", "number")
        .attr("min", "0")
        .property("value", "100")
        .on("change", updateCovid19);
    syncSelector.append("p").text("th death");

    // Date selectors
    const dateSelector = covid19.append("div").classed("date-selector", true).classed("margined", true);
    dateSelector.append("p").text("Date range: ");
    dateFrom = appendDateSelector(dateSelector).classed("from", true);
    dateTo = appendDateSelector(dateSelector).classed("to", true);
    const today = getToday();
    const t1 = applyDaysDiff(today, -20);
    const t2 = applyDaysDiff(today, 10);
    dateFrom.property('value', toISODateString(t1));
    dateTo.property('value', toISODateString(t2));

    updateCovid19();
    window.addEventListener("resize", updateCovid19);
}

////START_DATA////
// This section will be automatically replaced by the actual, full data, during deployment.
// In the meantime, here is a subset of the data to ease development.
covid19Data_ = {
    "France": {"total_cases": {"2020-01-22": 0, "2020-01-23": 0, "2020-01-24": 2, "2020-01-25": 3, "2020-01-26": 3, "2020-01-27": 3, "2020-01-28": 4, "2020-01-29": 5, "2020-01-30": 5, "2020-01-31": 5, "2020-02-01": 6, "2020-02-02": 6, "2020-02-03": 6, "2020-02-04": 6, "2020-02-05": 6, "2020-02-06": 6, "2020-02-07": 6, "2020-02-08": 11, "2020-02-09": 11, "2020-02-10": 11, "2020-02-11": 11, "2020-02-12": 11, "2020-02-13": 11, "2020-02-14": 11, "2020-02-15": 12, "2020-02-16": 12, "2020-02-17": 12, "2020-02-18": 12, "2020-02-19": 12, "2020-02-20": 12, "2020-02-21": 12, "2020-02-22": 12, "2020-02-23": 12, "2020-02-24": 12, "2020-02-25": 14, "2020-02-26": 18, "2020-02-27": 38, "2020-02-28": 57, "2020-02-29": 100, "2020-03-01": 130, "2020-03-02": 191, "2020-03-03": 204, "2020-03-04": 285, "2020-03-05": 377, "2020-03-06": 653, "2020-03-07": 949, "2020-03-08": 1126, "2020-03-09": 1209, "2020-03-10": 1784, "2020-03-11": 2281, "2020-03-12": 2281, "2020-03-13": 3661, "2020-03-14": 4469, "2020-03-15": 4499, "2020-03-16": 6633, "2020-03-17": 7652, "2020-03-18": 9043, "2020-03-19": 10871, "2020-03-20": 12612, "2020-03-21": 14282, "2020-03-22": 16018}, "total_deaths": {"2020-01-22": 0, "2020-01-23": 0, "2020-01-24": 0, "2020-01-25": 0, "2020-01-26": 0, "2020-01-27": 0, "2020-01-28": 0, "2020-01-29": 0, "2020-01-30": 0, "2020-01-31": 0, "2020-02-01": 0, "2020-02-02": 0, "2020-02-03": 0, "2020-02-04": 0, "2020-02-05": 0, "2020-02-06": 0, "2020-02-07": 0, "2020-02-08": 0, "2020-02-09": 0, "2020-02-10": 0, "2020-02-11": 0, "2020-02-12": 0, "2020-02-13": 0, "2020-02-14": 0, "2020-02-15": 1, "2020-02-16": 1, "2020-02-17": 1, "2020-02-18": 1, "2020-02-19": 1, "2020-02-20": 1, "2020-02-21": 1, "2020-02-22": 1, "2020-02-23": 1, "2020-02-24": 1, "2020-02-25": 1, "2020-02-26": 2, "2020-02-27": 2, "2020-02-28": 2, "2020-02-29": 2, "2020-03-01": 2, "2020-03-02": 3, "2020-03-03": 4, "2020-03-04": 4, "2020-03-05": 6, "2020-03-06": 9, "2020-03-07": 11, "2020-03-08": 19, "2020-03-09": 19, "2020-03-10": 33, "2020-03-11": 48, "2020-03-12": 48, "2020-03-13": 79, "2020-03-14": 91, "2020-03-15": 91, "2020-03-16": 148, "2020-03-17": 148, "2020-03-18": 148, "2020-03-19": 243, "2020-03-20": 450, "2020-03-21": 562, "2020-03-22": 674}},
    "Italy": {"total_cases": {"2020-01-22": 0, "2020-01-23": 0, "2020-01-24": 0, "2020-01-25": 0, "2020-01-26": 0, "2020-01-27": 0, "2020-01-28": 0, "2020-01-29": 0, "2020-01-30": 0, "2020-01-31": 2, "2020-02-01": 2, "2020-02-02": 2, "2020-02-03": 2, "2020-02-04": 2, "2020-02-05": 2, "2020-02-06": 2, "2020-02-07": 3, "2020-02-08": 3, "2020-02-09": 3, "2020-02-10": 3, "2020-02-11": 3, "2020-02-12": 3, "2020-02-13": 3, "2020-02-14": 3, "2020-02-15": 3, "2020-02-16": 3, "2020-02-17": 3, "2020-02-18": 3, "2020-02-19": 3, "2020-02-20": 4, "2020-02-21": 21, "2020-02-22": 79, "2020-02-23": 157, "2020-02-24": 229, "2020-02-25": 323, "2020-02-26": 470, "2020-02-27": 655, "2020-02-28": 889, "2020-02-29": 1128, "2020-03-01": 1701, "2020-03-02": 2036, "2020-03-03": 2502, "2020-03-04": 3089, "2020-03-05": 3858, "2020-03-06": 4636, "2020-03-07": 5883, "2020-03-08": 7375, "2020-03-09": 9172, "2020-03-10": 10149, "2020-03-11": 12462, "2020-03-12": 15113, "2020-03-13": 17660, "2020-03-14": 21157, "2020-03-15": 24747, "2020-03-16": 27980, "2020-03-17": 31506, "2020-03-18": 35713, "2020-03-19": 41035, "2020-03-20": 47021, "2020-03-21": 53578, "2020-03-22": 59138, "2020-03-23": 63927, "2020-03-24": 69176}, "total_deaths": {"2020-01-22": 0, "2020-01-23": 0, "2020-01-24": 0, "2020-01-25": 0, "2020-01-26": 0, "2020-01-27": 0, "2020-01-28": 0, "2020-01-29": 0, "2020-01-30": 0, "2020-01-31": 0, "2020-02-01": 0, "2020-02-02": 0, "2020-02-03": 0, "2020-02-04": 0, "2020-02-05": 0, "2020-02-06": 0, "2020-02-07": 0, "2020-02-08": 0, "2020-02-09": 0, "2020-02-10": 0, "2020-02-11": 0, "2020-02-12": 0, "2020-02-13": 0, "2020-02-14": 0, "2020-02-15": 0, "2020-02-16": 0, "2020-02-17": 0, "2020-02-18": 0, "2020-02-19": 0, "2020-02-20": 0, "2020-02-21": 1, "2020-02-22": 2, "2020-02-23": 3, "2020-02-24": 7, "2020-02-25": 11, "2020-02-26": 12, "2020-02-27": 17, "2020-02-28": 21, "2020-02-29": 29, "2020-03-01": 41, "2020-03-02": 52, "2020-03-03": 79, "2020-03-04": 107, "2020-03-05": 148, "2020-03-06": 197, "2020-03-07": 233, "2020-03-08": 366, "2020-03-09": 463, "2020-03-10": 631, "2020-03-11": 827, "2020-03-12": 1016, "2020-03-13": 1266, "2020-03-14": 1441, "2020-03-15": 1809, "2020-03-16": 2158, "2020-03-17": 2503, "2020-03-18": 2978, "2020-03-19": 3405, "2020-03-20": 4032, "2020-03-21": 4825, "2020-03-22": 5476, "2020-03-23": 6077, "2020-03-24": 6820}},
    "United States": {"total_cases": {"2020-02-15": 15, "2020-02-16": 15, "2020-02-17": 15, "2020-02-18": 15, "2020-02-19": 15, "2020-02-20": 15, "2020-02-21": 35, "2020-02-22": 35, "2020-02-23": 35, "2020-02-24": 53, "2020-02-25": 57, "2020-02-26": 60, "2020-02-27": 60, "2020-02-28": 63, "2020-02-29": 68, "2020-03-01": 75, "2020-03-02": 100, "2020-03-03": 124, "2020-03-04": 158, "2020-03-05": 221, "2020-03-06": 319, "2020-03-07": 435, "2020-03-08": 541, "2020-03-09": 704, "2020-03-10": 994, "2020-03-11": 1301, "2020-03-12": 1630, "2020-03-13": 2183, "2020-03-14": 2770, "2020-03-15": 3613, "2020-03-16": 4596, "2020-03-17": 6344, "2020-03-18": 9197, "2020-03-19": 13779, "2020-03-20": 19367, "2020-03-21": 24192, "2020-03-22": 33592, "2020-03-23": 43781, "2020-03-24": 54881}, "total_deaths": {"2020-02-15": 0, "2020-02-16": 0, "2020-02-17": 0, "2020-02-18": 0, "2020-02-19": 0, "2020-02-20": 0, "2020-02-21": 0, "2020-02-22": 0, "2020-02-23": 0, "2020-02-24": 0, "2020-02-25": 0, "2020-02-26": 0, "2020-02-27": 0, "2020-02-28": 0, "2020-02-29": 1, "2020-03-01": 1, "2020-03-02": 6, "2020-03-03": 9, "2020-03-04": 11, "2020-03-05": 12, "2020-03-06": 15, "2020-03-07": 19, "2020-03-08": 22, "2020-03-09": 26, "2020-03-10": 30, "2020-03-11": 38, "2020-03-12": 41, "2020-03-13": 48, "2020-03-14": 57, "2020-03-15": 69, "2020-03-16": 87, "2020-03-17": 110, "2020-03-18": 150, "2020-03-19": 206, "2020-03-20": 255, "2020-03-21": 301, "2020-03-22": 414, "2020-03-23": 555, "2020-03-24": 780}},
    "United States (Washington)": {"total_cases": {"2020-01-22": 0, "2020-01-23": 0, "2020-01-24": 0, "2020-01-25": 0, "2020-01-26": 0, "2020-01-27": 0, "2020-01-28": 0, "2020-01-29": 0, "2020-01-30": 0, "2020-01-31": 0, "2020-02-01": 0, "2020-02-02": 0, "2020-02-03": 0, "2020-02-04": 0, "2020-02-05": 0, "2020-02-06": 0, "2020-02-07": 0, "2020-02-08": 0, "2020-02-09": 0, "2020-02-10": 0, "2020-02-11": 0, "2020-02-12": 0, "2020-02-13": 0, "2020-02-14": 0, "2020-02-15": 0, "2020-02-16": 0, "2020-02-17": 0, "2020-02-18": 0, "2020-02-19": 0, "2020-02-20": 0, "2020-02-21": 0, "2020-02-22": 0, "2020-02-23": 0, "2020-02-24": 0, "2020-02-25": 0, "2020-02-26": 0, "2020-02-27": 0, "2020-02-28": 0, "2020-02-29": 0, "2020-03-01": 0, "2020-03-02": 0, "2020-03-03": 0, "2020-03-04": 0, "2020-03-05": 0, "2020-03-06": 0, "2020-03-07": 0, "2020-03-08": 0, "2020-03-09": 0, "2020-03-10": 267, "2020-03-11": 366, "2020-03-12": 442, "2020-03-13": 568, "2020-03-14": 572, "2020-03-15": 643, "2020-03-16": 904, "2020-03-17": 1076, "2020-03-18": 1014, "2020-03-19": 1376, "2020-03-20": 1524, "2020-03-21": 1793, "2020-03-22": 1996}, "total_deaths": {"2020-01-22": 0, "2020-01-23": 0, "2020-01-24": 0, "2020-01-25": 0, "2020-01-26": 0, "2020-01-27": 0, "2020-01-28": 0, "2020-01-29": 0, "2020-01-30": 0, "2020-01-31": 0, "2020-02-01": 0, "2020-02-02": 0, "2020-02-03": 0, "2020-02-04": 0, "2020-02-05": 0, "2020-02-06": 0, "2020-02-07": 0, "2020-02-08": 0, "2020-02-09": 0, "2020-02-10": 0, "2020-02-11": 0, "2020-02-12": 0, "2020-02-13": 0, "2020-02-14": 0, "2020-02-15": 0, "2020-02-16": 0, "2020-02-17": 0, "2020-02-18": 0, "2020-02-19": 0, "2020-02-20": 0, "2020-02-21": 0, "2020-02-22": 0, "2020-02-23": 0, "2020-02-24": 0, "2020-02-25": 0, "2020-02-26": 0, "2020-02-27": 0, "2020-02-28": 0, "2020-02-29": 0, "2020-03-01": 0, "2020-03-02": 0, "2020-03-03": 0, "2020-03-04": 0, "2020-03-05": 0, "2020-03-06": 0, "2020-03-07": 0, "2020-03-08": 0, "2020-03-09": 0, "2020-03-10": 23, "2020-03-11": 29, "2020-03-12": 31, "2020-03-13": 37, "2020-03-14": 37, "2020-03-15": 40, "2020-03-16": 48, "2020-03-17": 55, "2020-03-18": 55, "2020-03-19": 74, "2020-03-20": 83, "2020-03-21": 94, "2020-03-22": 95}},
    "United States (New York)": {"total_cases": {"2020-01-22": 0, "2020-01-23": 0, "2020-01-24": 0, "2020-01-25": 0, "2020-01-26": 0, "2020-01-27": 0, "2020-01-28": 0, "2020-01-29": 0, "2020-01-30": 0, "2020-01-31": 0, "2020-02-01": 0, "2020-02-02": 0, "2020-02-03": 0, "2020-02-04": 0, "2020-02-05": 0, "2020-02-06": 0, "2020-02-07": 0, "2020-02-08": 0, "2020-02-09": 0, "2020-02-10": 0, "2020-02-11": 0, "2020-02-12": 0, "2020-02-13": 0, "2020-02-14": 0, "2020-02-15": 0, "2020-02-16": 0, "2020-02-17": 0, "2020-02-18": 0, "2020-02-19": 0, "2020-02-20": 0, "2020-02-21": 0, "2020-02-22": 0, "2020-02-23": 0, "2020-02-24": 0, "2020-02-25": 0, "2020-02-26": 0, "2020-02-27": 0, "2020-02-28": 0, "2020-02-29": 0, "2020-03-01": 0, "2020-03-02": 0, "2020-03-03": 0, "2020-03-04": 0, "2020-03-05": 0, "2020-03-06": 0, "2020-03-07": 0, "2020-03-08": 0, "2020-03-09": 0, "2020-03-10": 173, "2020-03-11": 220, "2020-03-12": 328, "2020-03-13": 421, "2020-03-14": 525, "2020-03-15": 732, "2020-03-16": 967, "2020-03-17": 1706, "2020-03-18": 2495, "2020-03-19": 5365, "2020-03-20": 8310, "2020-03-21": 11710, "2020-03-22": 15793}, "total_deaths": {"2020-01-22": 0, "2020-01-23": 0, "2020-01-24": 0, "2020-01-25": 0, "2020-01-26": 0, "2020-01-27": 0, "2020-01-28": 0, "2020-01-29": 0, "2020-01-30": 0, "2020-01-31": 0, "2020-02-01": 0, "2020-02-02": 0, "2020-02-03": 0, "2020-02-04": 0, "2020-02-05": 0, "2020-02-06": 0, "2020-02-07": 0, "2020-02-08": 0, "2020-02-09": 0, "2020-02-10": 0, "2020-02-11": 0, "2020-02-12": 0, "2020-02-13": 0, "2020-02-14": 0, "2020-02-15": 0, "2020-02-16": 0, "2020-02-17": 0, "2020-02-18": 0, "2020-02-19": 0, "2020-02-20": 0, "2020-02-21": 0, "2020-02-22": 0, "2020-02-23": 0, "2020-02-24": 0, "2020-02-25": 0, "2020-02-26": 0, "2020-02-27": 0, "2020-02-28": 0, "2020-02-29": 0, "2020-03-01": 0, "2020-03-02": 0, "2020-03-03": 0, "2020-03-04": 0, "2020-03-05": 0, "2020-03-06": 0, "2020-03-07": 0, "2020-03-08": 0, "2020-03-09": 0, "2020-03-10": 0, "2020-03-11": 0, "2020-03-12": 0, "2020-03-13": 0, "2020-03-14": 2, "2020-03-15": 3, "2020-03-16": 10, "2020-03-17": 13, "2020-03-18": 16, "2020-03-19": 34, "2020-03-20": 42, "2020-03-21": 60, "2020-03-22": 117}},
    "United States (California)": {"total_cases": {"2020-01-22": 0, "2020-01-23": 0, "2020-01-24": 0, "2020-01-25": 0, "2020-01-26": 0, "2020-01-27": 0, "2020-01-28": 0, "2020-01-29": 0, "2020-01-30": 0, "2020-01-31": 0, "2020-02-01": 0, "2020-02-02": 0, "2020-02-03": 0, "2020-02-04": 0, "2020-02-05": 0, "2020-02-06": 0, "2020-02-07": 0, "2020-02-08": 0, "2020-02-09": 0, "2020-02-10": 0, "2020-02-11": 0, "2020-02-12": 0, "2020-02-13": 0, "2020-02-14": 0, "2020-02-15": 0, "2020-02-16": 0, "2020-02-17": 0, "2020-02-18": 0, "2020-02-19": 0, "2020-02-20": 0, "2020-02-21": 0, "2020-02-22": 0, "2020-02-23": 0, "2020-02-24": 0, "2020-02-25": 0, "2020-02-26": 0, "2020-02-27": 0, "2020-02-28": 0, "2020-02-29": 0, "2020-03-01": 0, "2020-03-02": 0, "2020-03-03": 0, "2020-03-04": 0, "2020-03-05": 0, "2020-03-06": 0, "2020-03-07": 0, "2020-03-08": 0, "2020-03-09": 0, "2020-03-10": 144, "2020-03-11": 177, "2020-03-12": 221, "2020-03-13": 282, "2020-03-14": 340, "2020-03-15": 426, "2020-03-16": 557, "2020-03-17": 698, "2020-03-18": 751, "2020-03-19": 952, "2020-03-20": 1177, "2020-03-21": 1364, "2020-03-22": 1642}, "total_deaths": {"2020-01-22": 0, "2020-01-23": 0, "2020-01-24": 0, "2020-01-25": 0, "2020-01-26": 0, "2020-01-27": 0, "2020-01-28": 0, "2020-01-29": 0, "2020-01-30": 0, "2020-01-31": 0, "2020-02-01": 0, "2020-02-02": 0, "2020-02-03": 0, "2020-02-04": 0, "2020-02-05": 0, "2020-02-06": 0, "2020-02-07": 0, "2020-02-08": 0, "2020-02-09": 0, "2020-02-10": 0, "2020-02-11": 0, "2020-02-12": 0, "2020-02-13": 0, "2020-02-14": 0, "2020-02-15": 0, "2020-02-16": 0, "2020-02-17": 0, "2020-02-18": 0, "2020-02-19": 0, "2020-02-20": 0, "2020-02-21": 0, "2020-02-22": 0, "2020-02-23": 0, "2020-02-24": 0, "2020-02-25": 0, "2020-02-26": 0, "2020-02-27": 0, "2020-02-28": 0, "2020-02-29": 0, "2020-03-01": 0, "2020-03-02": 0, "2020-03-03": 0, "2020-03-04": 0, "2020-03-05": 0, "2020-03-06": 0, "2020-03-07": 0, "2020-03-08": 0, "2020-03-09": 0, "2020-03-10": 2, "2020-03-11": 3, "2020-03-12": 4, "2020-03-13": 4, "2020-03-14": 5, "2020-03-15": 6, "2020-03-16": 7, "2020-03-17": 12, "2020-03-18": 13, "2020-03-19": 18, "2020-03-20": 23, "2020-03-21": 24, "2020-03-22": 30}},
}
////END_DATA////
