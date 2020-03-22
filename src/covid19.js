
// Get a list of all regions. Example: [ "France", "Italy", "United_States_of_America" ]
//
function getAllRegions() {
    const regions = [];
    for (const region in covid19Data_) {
        if (covid19Data_.hasOwnProperty(region)) {
            regions.push(region);
        }
    }
    return regions;
}

// Get a list of selected regions. Example: [ "France", "Italy" ]
//
function getSelectedRegions() {
    const regions = [];
    d3.selectAll(".region-select").each(function (d) {
        const region = d3.select(this).property('value');
        regions.push(region);
    });
    return regions;
}

// Given a category (e.g., "new_deaths"), and a list of regions
// (e.g., [ "France", "Italy" ]), get the data in the form:
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
    const dateParser = d3.timeParse("%Y-%m-%d");
    const data = [];
    let regionId = -1;
    const alreadyAddedRegions = [];
    regions.forEach(function (region) {
        regionId++;
        if (alreadyAddedRegions.indexOf(region) == -1) {
            alreadyAddedRegions.push(region);
            const values_ = covid19Data_[region][category];
            const values = [];
            for (const date in values_) {
                if (values_.hasOwnProperty(date)) {
                    values.push({
                        date: dateParser(date),
                        value: values_[date]
                    });
                }
            }
            data.push({
                id: regionId,
                region: region,
                values: values
            });
        }
    });
    return data;
}

// Append a drop down menu to the given parent with all given regions as
// options. Add an "onchange" event listener so that when users change their
// selection, the updateCovid19() function is called.
//
function appendRegionSelector(parent, regions) {
    const regionId = parent.selectAll(".region-selector").size();
    const tr = parent.append("table").append("tr").classed("region-selector", true).classed("margined", true);
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

// Append a category selector.
//
function appendCategorySelector(parent) {
    return parent
        .append("input")
        .attr("type", "checkbox")
        .on("change", updateCovid19);
}

function updateLines(category, xScale, yScale, dateFrom, dateTo, data) {
    const covid19 = d3.select("#covid19");
    const checkbox = covid19.select("." + category + "-checkbox");
    const lineGroup = covid19.select("." + category + "-lines");
    if (checkbox.property("checked")) {
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

function updateCovid19() {

    // Data
    const regions = getSelectedRegions();
    const dailyCasesData = getData("new_cases", regions);
    const dailyDeathsData = getData("new_deaths", regions);

    // TODO: compute cumulated data.

    // Dates
    const dateParser = d3.timeParse("%Y-%m-%d");
    dateFrom = dateParser(d3.select("#covid19 .date-selector .from").property("value"));
    dateTo = dateParser(d3.select("#covid19 .date-selector .to").property("value"));
    const dateFilter = function (d) {
            return dateFrom <= d.date && d.date <= dateTo;
    }

    // Compute max daily cases
    let maxDailyCases = 0;
    dailyCasesData.forEach(function (d) { // For each country
        d.values.forEach(function (d) { // For each date
            if (dateFilter(d) && d.value > maxDailyCases) {
                maxDailyCases = d.value;
            }
        });
    });

    // SVG Element
    const width = 960;
    const height = 500;
    const margin = 5;
    const padding = 5;
    const adj = 50;
    const svg = d3.select("#covid19 svg.graph")
        .attr("viewBox", "-"
              + adj + " -"
              + adj + " "
              + (width + adj*3) + " "
              + (height + adj*3));

    // Scales
    // For now we scale based on the first region
    // TODO: scale based all selected regions
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().rangeRound([height, 0]);
    xScale.domain([dateFrom, dateTo]);
    yScale.domain([0, maxDailyCases]);

    // Axes
    const yaxis = d3.axisLeft()
        .scale(yScale);

    const xaxis = d3.axisBottom()
        .ticks(d3.timeDay.every(1))
        .tickFormat(d3.timeFormat('%b %d'))
        .scale(xScale);

    svg.select(".x.axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xaxis)
      .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    svg.select(".y.axis")
        .call(yaxis);

    // Lines
    updateLines("daily-cases", xScale, yScale, dateFrom, dateTo, dailyCasesData);
    updateLines("daily-deaths", xScale, yScale, dateFrom, dateTo, dailyDeathsData);
}

function runCovid19() {

    // App main container
    const covid19 = d3.select("div#covid19");

    // Region selectors
    const regions = getAllRegions();
    const regionselector = covid19.append("label").text("Countries to compare:");
    const selector1 = appendRegionSelector(covid19, regions);
    const selector2 = appendRegionSelector(covid19, regions);
    selector1.property('value', 'France');
    selector2.property('value', 'Italy');

    // Date selectors
    const dateSelector = covid19.append("div").classed("date-selector", true).classed("margined", true);
    dateSelector.append("label").text("From: ");
    dateFrom = appendDateSelector(dateSelector).classed("from", true);
    dateSelector.append("br").classed("break-at-small-sizes", true);
    dateSelector.append("label").text("To: ");
    dateTo = appendDateSelector(dateSelector).classed("to", true);
    const t2 = new Date();
    const t1 = new Date(); t1.setDate(t1.getDate() - 30);
    dateFrom.property('value', t1.toISOString().split('T')[0]);
    dateTo.property('value', t2.toISOString().split('T')[0]);

    // Category selector
    const categorySelector = covid19.append("div").classed("category-selector", true).classed("margined", true);
    appendCategorySelector(categorySelector).classed("daily-cases-checkbox", true).property("checked", true);
    categorySelector.append("label").text(" Daily Cases");
    appendCategorySelector(categorySelector).classed("daily-deaths-checkbox", true).property("checked", true);
    categorySelector.append("label").text(" Daily Deaths");

    // SVG
    const svg = d3.select("div#covid19").append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .classed("graph", true);

    // Axes
    svg.append("g").attr("class", "x axis");
    svg.append("g").attr("class", "y axis");

    // Lines
    svg.append("g").attr("class", "daily-cases-lines");
    svg.append("g").attr("class", "daily-deaths-lines");

    updateCovid19();
}

////START_DATA////
// This section will be automatically replaced by the actual, full data, during deployment.
// In the meantime, here is a subset of the data to ease development.
covid19Data_ = {
    "France": {"new_cases": {"2020-03-21": 1617, "2020-03-20": 1861, "2020-03-19": 1404, "2020-03-18": 1097, "2020-03-17": 1210, "2020-03-16": 924, "2020-03-15": 838, "2020-03-14": 785, "2020-03-13": 595, "2020-03-12": 497, "2020-03-11": 372, "2020-03-10": 286, "2020-03-09": 410, "2020-03-08": 103, "2020-03-07": 190, "2020-03-06": 138, "2020-03-05": 73, "2020-03-04": 34, "2020-03-03": 48, "2020-03-02": 30, "2020-03-01": 43, "2020-02-29": 19, "2020-02-28": 21, "2020-02-27": 3, "2020-02-26": 2, "2020-02-25": 0, "2020-02-24": 0, "2020-02-23": 0, "2020-02-22": 0, "2020-02-21": 0, "2020-02-20": 0, "2020-02-19": 0, "2020-02-18": 0, "2020-02-17": 1, "2020-02-16": 0, "2020-02-15": 0, "2020-02-14": 0, "2020-02-13": 0, "2020-02-12": 0, "2020-02-11": 0, "2020-02-10": 0, "2020-02-09": 0, "2020-02-08": 5, "2020-02-07": 0, "2020-02-06": 0, "2020-02-05": 0, "2020-02-04": 0, "2020-02-03": 0, "2020-02-02": 0, "2020-02-01": 0, "2020-01-31": 1, "2020-01-30": 1, "2020-01-29": 1, "2020-01-28": 0, "2020-01-27": 0, "2020-01-26": 0, "2020-01-25": 3, "2020-01-24": 0, "2020-01-23": 0, "2020-01-22": 0, "2020-01-21": 0, "2020-01-20": 0, "2020-01-19": 0, "2020-01-18": 0, "2020-01-17": 0, "2020-01-16": 0, "2020-01-15": 0, "2020-01-14": 0, "2020-01-13": 0, "2020-01-12": 0, "2020-01-11": 0, "2020-01-10": 0, "2020-01-09": 0, "2020-01-08": 0, "2020-01-07": 0, "2020-01-06": 0, "2020-01-05": 0, "2020-01-04": 0, "2020-01-03": 0, "2020-01-02": 0, "2020-01-01": 0, "2019-12-31": 0}, "new_deaths": {"2020-03-21": 78, "2020-03-20": 128, "2020-03-19": 69, "2020-03-18": 27, "2020-03-17": 21, "2020-03-16": 36, "2020-03-15": 12, "2020-03-14": 18, "2020-03-13": 13, "2020-03-12": 15, "2020-03-11": 3, "2020-03-10": 11, "2020-03-09": 9, "2020-03-08": 1, "2020-03-07": 2, "2020-03-06": 3, "2020-03-05": 0, "2020-03-04": 1, "2020-03-03": 1, "2020-03-02": 0, "2020-03-01": 0, "2020-02-29": 0, "2020-02-28": 0, "2020-02-27": 1, "2020-02-26": 0, "2020-02-25": 0, "2020-02-24": 0, "2020-02-23": 0, "2020-02-22": 0, "2020-02-21": 0, "2020-02-20": 0, "2020-02-19": 0, "2020-02-18": 0, "2020-02-17": 0, "2020-02-16": 0, "2020-02-15": 1, "2020-02-14": 0, "2020-02-13": 0, "2020-02-12": 0, "2020-02-11": 0, "2020-02-10": 0, "2020-02-09": 0, "2020-02-08": 0, "2020-02-07": 0, "2020-02-06": 0, "2020-02-05": 0, "2020-02-04": 0, "2020-02-03": 0, "2020-02-02": 0, "2020-02-01": 0, "2020-01-31": 0, "2020-01-30": 0, "2020-01-29": 0, "2020-01-28": 0, "2020-01-27": 0, "2020-01-26": 0, "2020-01-25": 0, "2020-01-24": 0, "2020-01-23": 0, "2020-01-22": 0, "2020-01-21": 0, "2020-01-20": 0, "2020-01-19": 0, "2020-01-18": 0, "2020-01-17": 0, "2020-01-16": 0, "2020-01-15": 0, "2020-01-14": 0, "2020-01-13": 0, "2020-01-12": 0, "2020-01-11": 0, "2020-01-10": 0, "2020-01-09": 0, "2020-01-08": 0, "2020-01-07": 0, "2020-01-06": 0, "2020-01-05": 0, "2020-01-04": 0, "2020-01-03": 0, "2020-01-02": 0, "2020-01-01": 0, "2019-12-31": 0}},
    "Italy": {"new_cases": {"2020-03-21": 5986, "2020-03-20": 5322, "2020-03-19": 4207, "2020-03-18": 3526, "2020-03-17": 4000, "2020-03-16": 6230, "2020-03-15": 90, "2020-03-14": 2547, "2020-03-13": 2651, "2020-03-12": 2313, "2020-03-11": 977, "2020-03-10": 1797, "2020-03-09": 1492, "2020-03-08": 1247, "2020-03-07": 778, "2020-03-06": 769, "2020-03-05": 587, "2020-03-04": 667, "2020-03-03": 146, "2020-03-02": 561, "2020-03-01": 240, "2020-02-29": 238, "2020-02-28": 250, "2020-02-27": 78, "2020-02-26": 93, "2020-02-25": 97, "2020-02-24": 53, "2020-02-23": 62, "2020-02-22": 14, "2020-02-21": 0, "2020-02-20": 0, "2020-02-19": 0, "2020-02-18": 0, "2020-02-17": 0, "2020-02-16": 0, "2020-02-15": 0, "2020-02-14": 0, "2020-02-13": 0, "2020-02-12": 0, "2020-02-11": 0, "2020-02-10": 0, "2020-02-09": 0, "2020-02-08": 0, "2020-02-07": 0, "2020-02-06": 0, "2020-02-05": 0, "2020-02-04": 0, "2020-02-03": 0, "2020-02-02": 0, "2020-02-01": 0, "2020-01-31": 3, "2020-01-30": 0, "2020-01-29": 0, "2020-01-28": 0, "2020-01-27": 0, "2020-01-26": 0, "2020-01-25": 0, "2020-01-24": 0, "2020-01-23": 0, "2020-01-22": 0, "2020-01-21": 0, "2020-01-20": 0, "2020-01-19": 0, "2020-01-18": 0, "2020-01-17": 0, "2020-01-16": 0, "2020-01-15": 0, "2020-01-14": 0, "2020-01-13": 0, "2020-01-12": 0, "2020-01-11": 0, "2020-01-10": 0, "2020-01-09": 0, "2020-01-08": 0, "2020-01-07": 0, "2020-01-06": 0, "2020-01-05": 0, "2020-01-04": 0, "2020-01-03": 0, "2020-01-02": 0, "2020-01-01": 0, "2019-12-31": 0}, "new_deaths": {"2020-03-21": 625, "2020-03-20": 429, "2020-03-19": 473, "2020-03-18": 347, "2020-03-17": 347, "2020-03-16": 370, "2020-03-15": 173, "2020-03-14": 252, "2020-03-13": 189, "2020-03-12": 196, "2020-03-11": 167, "2020-03-10": 98, "2020-03-09": 133, "2020-03-08": 36, "2020-03-07": 49, "2020-03-06": 41, "2020-03-05": 27, "2020-03-04": 28, "2020-03-03": 17, "2020-03-02": 6, "2020-03-01": 8, "2020-02-29": 4, "2020-02-28": 5, "2020-02-27": 1, "2020-02-26": 5, "2020-02-25": 4, "2020-02-24": 0, "2020-02-23": 2, "2020-02-22": 0, "2020-02-21": 0, "2020-02-20": 0, "2020-02-19": 0, "2020-02-18": 0, "2020-02-17": 0, "2020-02-16": 0, "2020-02-15": 0, "2020-02-14": 0, "2020-02-13": 0, "2020-02-12": 0, "2020-02-11": 0, "2020-02-10": 0, "2020-02-09": 0, "2020-02-08": 0, "2020-02-07": 0, "2020-02-06": 0, "2020-02-05": 0, "2020-02-04": 0, "2020-02-03": 0, "2020-02-02": 0, "2020-02-01": 0, "2020-01-31": 0, "2020-01-30": 0, "2020-01-29": 0, "2020-01-28": 0, "2020-01-27": 0, "2020-01-26": 0, "2020-01-25": 0, "2020-01-24": 0, "2020-01-23": 0, "2020-01-22": 0, "2020-01-21": 0, "2020-01-20": 0, "2020-01-19": 0, "2020-01-18": 0, "2020-01-17": 0, "2020-01-16": 0, "2020-01-15": 0, "2020-01-14": 0, "2020-01-13": 0, "2020-01-12": 0, "2020-01-11": 0, "2020-01-10": 0, "2020-01-09": 0, "2020-01-08": 0, "2020-01-07": 0, "2020-01-06": 0, "2020-01-05": 0, "2020-01-04": 0, "2020-01-03": 0, "2020-01-02": 0, "2020-01-01": 0, "2019-12-31": 0}},
    "United_States_of_America": {"new_cases": {"2020-03-21": 5374, "2020-03-20": 4835, "2020-03-19": 2988, "2020-03-18": 1766, "2020-03-17": 887, "2020-03-16": 823, "2020-03-15": 777, "2020-03-14": 511, "2020-03-13": 351, "2020-03-12": 287, "2020-03-11": 271, "2020-03-10": 200, "2020-03-09": 121, "2020-03-08": 95, "2020-03-07": 105, "2020-03-06": 74, "2020-03-05": 34, "2020-03-04": 22, "2020-03-03": 14, "2020-03-02": 20, "2020-03-01": 3, "2020-02-29": 6, "2020-02-28": 1, "2020-02-27": 6, "2020-02-26": 0, "2020-02-25": 18, "2020-02-24": 0, "2020-02-23": 0, "2020-02-22": 19, "2020-02-21": 1, "2020-02-20": 0, "2020-02-19": 0, "2020-02-18": 0, "2020-02-17": 0, "2020-02-16": 0, "2020-02-15": 0, "2020-02-14": 1, "2020-02-13": 1, "2020-02-12": 0, "2020-02-11": 1, "2020-02-10": 0, "2020-02-09": 0, "2020-02-08": 0, "2020-02-07": 0, "2020-02-06": 1, "2020-02-05": 0, "2020-02-04": 0, "2020-02-03": 3, "2020-02-02": 1, "2020-02-01": 1, "2020-01-31": 1, "2020-01-30": 0, "2020-01-29": 0, "2020-01-28": 0, "2020-01-27": 3, "2020-01-26": 0, "2020-01-25": 1, "2020-01-24": 0, "2020-01-23": 0, "2020-01-22": 0, "2020-01-21": 1, "2020-01-20": 0, "2020-01-19": 0, "2020-01-18": 0, "2020-01-17": 0, "2020-01-16": 0, "2020-01-15": 0, "2020-01-14": 0, "2020-01-13": 0, "2020-01-12": 0, "2020-01-11": 0, "2020-01-10": 0, "2020-01-09": 0, "2020-01-08": 0, "2020-01-07": 0, "2020-01-06": 0, "2020-01-05": 0, "2020-01-04": 0, "2020-01-03": 0, "2020-01-02": 0, "2020-01-01": 0, "2019-12-31": 0}, "new_deaths": {"2020-03-21": 110, "2020-03-20": 0, "2020-03-19": 42, "2020-03-18": 23, "2020-03-17": 16, "2020-03-16": 12, "2020-03-15": 10, "2020-03-14": 7, "2020-03-13": 10, "2020-03-12": 2, "2020-03-11": 2, "2020-03-10": 5, "2020-03-09": 4, "2020-03-08": 3, "2020-03-07": 2, "2020-03-06": 1, "2020-03-05": 2, "2020-03-04": 3, "2020-03-03": 4, "2020-03-02": 1, "2020-03-01": 1, "2020-02-29": 0, "2020-02-28": 0, "2020-02-27": 0, "2020-02-26": 0, "2020-02-25": 0, "2020-02-24": 0, "2020-02-23": 0, "2020-02-22": 0, "2020-02-21": 0, "2020-02-20": 0, "2020-02-19": 0, "2020-02-18": 0, "2020-02-17": 0, "2020-02-16": 0, "2020-02-15": 0, "2020-02-14": 0, "2020-02-13": 0, "2020-02-12": 0, "2020-02-11": 0, "2020-02-10": 0, "2020-02-09": 0, "2020-02-08": 0, "2020-02-07": 0, "2020-02-06": 0, "2020-02-05": 0, "2020-02-04": 0, "2020-02-03": 0, "2020-02-02": 0, "2020-02-01": 0, "2020-01-31": 0, "2020-01-30": 0, "2020-01-29": 0, "2020-01-28": 0, "2020-01-27": 0, "2020-01-26": 0, "2020-01-25": 0, "2020-01-24": 0, "2020-01-23": 0, "2020-01-22": 0, "2020-01-21": 0, "2020-01-20": 0, "2020-01-19": 0, "2020-01-18": 0, "2020-01-17": 0, "2020-01-16": 0, "2020-01-15": 0, "2020-01-14": 0, "2020-01-13": 0, "2020-01-12": 0, "2020-01-11": 0, "2020-01-10": 0, "2020-01-09": 0, "2020-01-08": 0, "2020-01-07": 0, "2020-01-06": 0, "2020-01-05": 0, "2020-01-04": 0, "2020-01-03": 0, "2020-01-02": 0, "2020-01-01": 0, "2019-12-31": 0}}
}
////END_DATA////
