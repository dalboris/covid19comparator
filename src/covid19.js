
// Given a category (e.g., "new_deaths"), get the data in the form:
//
// [
//   {
//     region: "Italy",
//     values: [ { date: <datetime>, value: 6230 }, ... ]
//   },
//   {
//     region: "France",
//     values: [ { date: <datetime>, value: 3210 }, ... ]
//   }
// ]
//
function getDataForCategory(category) {
    const dateParser = d3.timeParse("%Y-%m-%d");
    const data = [];
    for (const region in covid19Data_) {
        if (covid19Data_.hasOwnProperty(region)) {
            const values_ = covid19Data_[region][category]
            values = []
            for (const date in values_) {
                if (values_.hasOwnProperty(date)) {
                    values.push({
                        date: dateParser(date),
                        value: values_[date]
                    });
                }
            }
            data.push({
                region: region,
                values: values
            });
        }
    }
    return data;
}

function appendRegionSelector(parent, data) {
    parent
        .append("select")
        .selectAll("option")
        .data(data)
        .enter()
        .append("option")
        .text(function(d) { return d.region; })
        .attr("value", function (d, i) {
            return i;
        });
}

function runCovid19() {

    // App main container
    const covid19 = d3.select("div#covid19");

    // Data
    const data = getDataForCategory("new_cases");
    console.log(data);

    // Region selectors
    const regionselector = covid19.append("label").text("Countries to compare:");
    appendRegionSelector(covid19, data)
    appendRegionSelector(covid19, data)

    // SVG Element
    const width = 960;
    const height = 500;
    const margin = 5;
    const padding = 5;
    const adj = 50;
    const svg = d3.select("div#covid19").append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "-"
              + adj + " -"
              + adj + " "
              + (width + adj*3) + " "
              + (height + adj*3))
        .classed("graph", true);

    // Scales
    // For now we scale based on the first region
    // TODO: scale based all selected regions
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().rangeRound([height, 0]);
    xScale.domain(d3.extent(data[0].values, function(d){return d.date}));
    yScale.domain([0, d3.max(data[0].values, function(d){return d.value})]);

    // Axes
    const yaxis = d3.axisLeft()
        .scale(yScale);
    const xaxis = d3.axisBottom()
        .ticks(d3.timeDay.every(1))
        .tickFormat(d3.timeFormat('%b %d'))
        .scale(xScale);

    // Lines
    const line = d3.line()
        .x(function(d) { return xScale(d.date); })
        .y(function(d) { return yScale(d.value); });
    const lines = svg.selectAll("lines")
        .data(data)
        .enter()
        .append("g");
    let id = 0;
    const ids = function () { return "line-"+id++; }
    lines.append("path")
        .attr("class", ids)
        .classed("line", true)
        .attr("d", function(d) { return line(d.values); });

    // Drawing
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xaxis)
      .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");
    svg.append("g")
        .attr("class", "axis")
        .call(yaxis);
}

////START_DATA////
// This section will be automatically replaced by the actual, full data, during deployment.
// In the meantime, here is a subset of the data to ease development.
covid19Data_ = {
    "Italy": {"new_cases": {"2020-03-16": 6230, "2020-03-15": 90, "2020-03-14": 2547, "2020-03-13": 2651, "2020-03-12": 2313, "2020-03-11": 977, "2020-03-10": 1797, "2020-03-09": 1492, "2020-03-08": 1247, "2020-03-07": 778, "2020-03-06": 769, "2020-03-05": 587, "2020-03-04": 667, "2020-03-03": 146, "2020-03-02": 561, "2020-03-01": 240, "2020-02-29": 238, "2020-02-28": 250, "2020-02-27": 78, "2020-02-26": 93, "2020-02-25": 97, "2020-02-24": 53, "2020-02-23": 62, "2020-02-22": 14, "2020-02-21": 0, "2020-02-20": 0, "2020-02-19": 0, "2020-02-18": 0, "2020-02-17": 0, "2020-02-16": 0, "2020-02-15": 0, "2020-02-14": 0, "2020-02-13": 0, "2020-02-12": 0, "2020-02-11": 0, "2020-02-10": 0, "2020-02-09": 0, "2020-02-08": 0, "2020-02-07": 0, "2020-02-06": 0, "2020-02-05": 0, "2020-02-04": 0, "2020-02-03": 0, "2020-02-02": 0, "2020-02-01": 0, "2020-01-31": 3, "2020-01-30": 0, "2020-01-29": 0, "2020-01-28": 0, "2020-01-27": 0, "2020-01-26": 0, "2020-01-25": 0, "2020-01-24": 0, "2020-01-23": 0, "2020-01-22": 0, "2020-01-21": 0, "2020-01-20": 0, "2020-01-19": 0, "2020-01-18": 0, "2020-01-17": 0, "2020-01-16": 0, "2020-01-15": 0, "2020-01-14": 0, "2020-01-13": 0, "2020-01-12": 0, "2020-01-11": 0, "2020-01-10": 0, "2020-01-09": 0, "2020-01-08": 0, "2020-01-07": 0, "2020-01-06": 0, "2020-01-05": 0, "2020-01-04": 0, "2020-01-03": 0, "2020-01-02": 0, "2020-01-01": 0, "2019-12-31": 0}, "new_deaths": {"2020-03-16": 370, "2020-03-15": 173, "2020-03-14": 252, "2020-03-13": 189, "2020-03-12": 196, "2020-03-11": 167, "2020-03-10": 98, "2020-03-09": 133, "2020-03-08": 36, "2020-03-07": 49, "2020-03-06": 41, "2020-03-05": 27, "2020-03-04": 28, "2020-03-03": 17, "2020-03-02": 6, "2020-03-01": 8, "2020-02-29": 4, "2020-02-28": 5, "2020-02-27": 1, "2020-02-26": 5, "2020-02-25": 4, "2020-02-24": 0, "2020-02-23": 2, "2020-02-22": 0, "2020-02-21": 0, "2020-02-20": 0, "2020-02-19": 0, "2020-02-18": 0, "2020-02-17": 0, "2020-02-16": 0, "2020-02-15": 0, "2020-02-14": 0, "2020-02-13": 0, "2020-02-12": 0, "2020-02-11": 0, "2020-02-10": 0, "2020-02-09": 0, "2020-02-08": 0, "2020-02-07": 0, "2020-02-06": 0, "2020-02-05": 0, "2020-02-04": 0, "2020-02-03": 0, "2020-02-02": 0, "2020-02-01": 0, "2020-01-31": 0, "2020-01-30": 0, "2020-01-29": 0, "2020-01-28": 0, "2020-01-27": 0, "2020-01-26": 0, "2020-01-25": 0, "2020-01-24": 0, "2020-01-23": 0, "2020-01-22": 0, "2020-01-21": 0, "2020-01-20": 0, "2020-01-19": 0, "2020-01-18": 0, "2020-01-17": 0, "2020-01-16": 0, "2020-01-15": 0, "2020-01-14": 0, "2020-01-13": 0, "2020-01-12": 0, "2020-01-11": 0, "2020-01-10": 0, "2020-01-09": 0, "2020-01-08": 0, "2020-01-07": 0, "2020-01-06": 0, "2020-01-05": 0, "2020-01-04": 0, "2020-01-03": 0, "2020-01-02": 0, "2020-01-01": 0, "2019-12-31": 0}},
    "United States of America": {"new_cases": {"2020-03-16": 823, "2020-03-15": 777, "2020-03-14": 511, "2020-03-13": 351, "2020-03-12": 287, "2020-03-11": 271, "2020-03-10": 200, "2020-03-09": 121, "2020-03-08": 95, "2020-03-07": 105, "2020-03-06": 74, "2020-03-05": 34, "2020-03-04": 22, "2020-03-03": 14, "2020-03-02": 20, "2020-03-01": 3, "2020-02-29": 6, "2020-02-28": 1, "2020-02-27": 6, "2020-02-26": 0, "2020-02-25": 18, "2020-02-24": 0, "2020-02-23": 0, "2020-02-22": 19, "2020-02-21": 1, "2020-02-20": 0, "2020-02-19": 0, "2020-02-18": 0, "2020-02-17": 0, "2020-02-16": 0, "2020-02-15": 0, "2020-02-14": 1, "2020-02-13": 1, "2020-02-12": 0, "2020-02-11": 1, "2020-02-10": 0, "2020-02-09": 0, "2020-02-08": 0, "2020-02-07": 0, "2020-02-06": 1, "2020-02-05": 0, "2020-02-04": 0, "2020-02-03": 3, "2020-02-02": 1, "2020-02-01": 1, "2020-01-31": 1, "2020-01-30": 0, "2020-01-29": 0, "2020-01-28": 0, "2020-01-27": 3, "2020-01-26": 0, "2020-01-25": 1, "2020-01-24": 0, "2020-01-23": 0, "2020-01-22": 0, "2020-01-21": 1, "2020-01-20": 0, "2020-01-19": 0, "2020-01-18": 0, "2020-01-17": 0, "2020-01-16": 0, "2020-01-15": 0, "2020-01-14": 0, "2020-01-13": 0, "2020-01-12": 0, "2020-01-11": 0, "2020-01-10": 0, "2020-01-09": 0, "2020-01-08": 0, "2020-01-07": 0, "2020-01-06": 0, "2020-01-05": 0, "2020-01-04": 0, "2020-01-03": 0, "2020-01-02": 0, "2020-01-01": 0, "2019-12-31": 0}, "new_deaths": {"2020-03-16": 12, "2020-03-15": 10, "2020-03-14": 7, "2020-03-13": 10, "2020-03-12": 2, "2020-03-11": 2, "2020-03-10": 5, "2020-03-09": 4, "2020-03-08": 3, "2020-03-07": 2, "2020-03-06": 1, "2020-03-05": 2, "2020-03-04": 3, "2020-03-03": 4, "2020-03-02": 1, "2020-03-01": 1, "2020-02-29": 0, "2020-02-28": 0, "2020-02-27": 0, "2020-02-26": 0, "2020-02-25": 0, "2020-02-24": 0, "2020-02-23": 0, "2020-02-22": 0, "2020-02-21": 0, "2020-02-20": 0, "2020-02-19": 0, "2020-02-18": 0, "2020-02-17": 0, "2020-02-16": 0, "2020-02-15": 0, "2020-02-14": 0, "2020-02-13": 0, "2020-02-12": 0, "2020-02-11": 0, "2020-02-10": 0, "2020-02-09": 0, "2020-02-08": 0, "2020-02-07": 0, "2020-02-06": 0, "2020-02-05": 0, "2020-02-04": 0, "2020-02-03": 0, "2020-02-02": 0, "2020-02-01": 0, "2020-01-31": 0, "2020-01-30": 0, "2020-01-29": 0, "2020-01-28": 0, "2020-01-27": 0, "2020-01-26": 0, "2020-01-25": 0, "2020-01-24": 0, "2020-01-23": 0, "2020-01-22": 0, "2020-01-21": 0, "2020-01-20": 0, "2020-01-19": 0, "2020-01-18": 0, "2020-01-17": 0, "2020-01-16": 0, "2020-01-15": 0, "2020-01-14": 0, "2020-01-13": 0, "2020-01-12": 0, "2020-01-11": 0, "2020-01-10": 0, "2020-01-09": 0, "2020-01-08": 0, "2020-01-07": 0, "2020-01-06": 0, "2020-01-05": 0, "2020-01-04": 0, "2020-01-03": 0, "2020-01-02": 0, "2020-01-01": 0, "2019-12-31": 0}}
}
////END_DATA////
