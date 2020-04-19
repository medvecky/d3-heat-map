const sourceDataUrl = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

function d3HeatMapBuilder() {

    const fontSize = 16;

    const colorbrewer = {
        RdYlBu: {
            3: ["#fc8d59", "#ffffbf", "#91bfdb"],
            4: ["#d7191c", "#fdae61", "#abd9e9", "#2c7bb6"],
            5: ["#d7191c", "#fdae61", "#ffffbf", "#abd9e9", "#2c7bb6"],
            6: ["#d73027", "#fc8d59", "#fee090", "#e0f3f8", "#91bfdb", "#4575b4"],
            7: ["#d73027", "#fc8d59", "#fee090", "#ffffbf", "#e0f3f8", "#91bfdb", "#4575b4"],
            8: ["#d73027", "#f46d43", "#fdae61", "#fee090", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
            9: ["#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
            10: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"],
            11: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"]
        },
        RdBu: {
            3: ["#ef8a62", "#f7f7f7", "#67a9cf"],
            4: ["#ca0020", "#f4a582", "#92c5de", "#0571b0"],
            5: ["#ca0020", "#f4a582", "#f7f7f7", "#92c5de", "#0571b0"],
            6: ["#b2182b", "#ef8a62", "#fddbc7", "#d1e5f0", "#67a9cf", "#2166ac"],
            7: ["#b2182b", "#ef8a62", "#fddbc7", "#f7f7f7", "#d1e5f0", "#67a9cf", "#2166ac"],
            8: ["#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac"],
            9: ["#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac"],
            10: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"],
            11: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"]
        }
    };

    const section = d3.select("body")
        .append("section");

    const heading = section.append("heading");
    heading.append("h1")
        .attr('id', 'title')
        .text("Monthly Global Land-Surface Temperature");


    fetch(sourceDataUrl)
        .then(response => response.json())
        .then(result => {
            const data = result;

            data.monthlyVariance.forEach(val => val.month -= 1);

            const width = 5 * Math.ceil(data.monthlyVariance.length / 12); //1500;
            const height = 33 * 12; //400;
            const padding = {left: 9 * fontSize, right: 9 * fontSize, top: 1 * fontSize, bottom: 8 * fontSize};

            const legendColors = colorbrewer.RdYlBu[11].reverse();
            const legendWidth = 400;
            const legendHeight = 300/legendColors.length;

            const variance = data.monthlyVariance.map(function(val){
                return val.variance;
            });
            const minTemp = data.baseTemperature + Math.min.apply(null, variance);
            const maxTemp = data.baseTemperature + Math.max.apply(null, variance);

            const legendThreshold = d3.scale.threshold()
                .domain((function(min,max,count){
                    let array = [];
                    const step = (max-min)/count;
                    const base = min;
                    for(let i = 1; i < count; i++){
                        array.push(base + i*step);
                    }
                    return array;
                })(minTemp, maxTemp,legendColors.length))
                .range(legendColors);

            heading.append("h3")
                .attr('id', 'description')
                .html(data.monthlyVariance[0].year
                    + " - " + data.monthlyVariance[data.monthlyVariance.length - 1].year
                    + ": base temperature " + data.baseTemperature + "&#8451;");

            const tip = d3.tip()
                .attr("class", "d3-tip")
                .attr("id", "tooltip")
                .html((d) => d)
                .direction("n")
                .offset([-10, 0]);

            const svg = section.append("svg")
                .attr({
                    width: width + padding.left + padding.right,
                    height: height + padding.top + padding.bottom
                })
                .call(tip);

            const xScale = d3.scale.ordinal()
                .domain(data.monthlyVariance.map(val => val.year))
                .rangeRoundBands([0, width], 0, 0);

            const xAxis = d3.svg.axis()
                .scale(xScale)
                .tickValues(xScale.domain().filter(year => year % 10 === 0))
                .tickFormat(year => {
                    const date = new Date(0);
                    date.setUTCFullYear(year)
                    return d3.time.format.utc("%Y")(date);
                })
                .orient("bottom")
                .tickSize(10, 1);

            svg.append("g")
                .classed("x-axis", true)
                .attr("id", "x-axis")
                .attr("transform", "translate(" + padding.left + "," + (height + padding.top) + ")")
                .call(xAxis)
                .append("text")
                .text("Years")
                .style("text-anchor", "middle")
                .attr("transform", "translate(" + (width / 2) + "," + (3 * fontSize) + ")");

            const yScale = d3.scale.ordinal()
                .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) //months
                .rangeRoundBands([0, height], 0, 0);
            const yAxis = d3.svg.axis()
                .scale(yScale)
                .tickValues(yScale.domain())
                .tickFormat(month => {
                    const date = new Date(0);
                    date.setUTCMonth(month);
                    return d3.time.format.utc("%B")(date);
                })
                .orient("left")
                .tickSize(10, 1);

            svg.append("g")
                .classed("y-axis", true)
                .attr("id", "y-axis")
                .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
                .call(yAxis)
                .append("text")
                .text("Months")
                .style("text-anchor", "middle")
                .attr("transform", "translate(" + (-7 * fontSize) + "," + (height / 2) + ")" + "rotate(-90)");

            svg.append("g")
                .classed("map", true)
                .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
                .selectAll("rect")
                .data(data.monthlyVariance)
                .enter().append("rect")
                .attr('class', 'cell')
                .attr('data-month', d => d.month)
                .attr('data-year', d => d.year)
                .attr('data-temp', d => data.baseTemperature + d.variance)
                .attr({
                    x: (d, i) => xScale(d.year),
                    y: (d, i) => yScale(d.month),
                    width: (d, i) => xScale.rangeBand(d.year),
                    height: (d, i) => yScale.rangeBand(d.month)
                })
                .attr("fill", (d, i) => legendThreshold(data.baseTemperature + d.variance))
                .on("mouseover", d => {
                    const date = new Date(d.year, d.month);
                    const str = "<span class='date'>" + d3.time.format("%Y - %B")(date) + "</span>" + "<br />"
                        + "<span class='temperature'>" + d3.format(".1f")(data.baseTemperature + d.variance)
                        + "&#8451;" + "</span>" + "<br />"
                        + "<span class='variance'>" + d3.format("+.1f")(d.variance) + "&#8451;" + "</span>";
                    tip.attr("data-year", d.year);
                    tip.show(str);
                })
                .on("mouseout", tip.hide);

            const legendX = d3.scale.linear()
                .domain([minTemp, maxTemp])
                .range([0, legendWidth]);

            const legendXAxis = d3.svg.axis()
                .scale(legendX)
                .orient("bottom")
                .tickSize(10, 0)
                .tickValues(legendThreshold.domain())
                .tickFormat(d3.format(".1f"));

            const legend = svg.append("g")
                .classed("legend", true)
                .attr("id", "legend")
                .attr("transform", "translate(" + (padding.left) + "," + (padding.top + height + padding.bottom - 2*legendHeight) + ")");

            legend.append("g")
                .selectAll("rect")
                .data(legendThreshold.range().map(color => {
                    const d = legendThreshold.invertExtent(color);
                    if(d[0] == null) d[0] = legendX.domain()[0];
                    if(d[1] == null) d[1] = legendX.domain()[1];
                    return d;
                }))
                .enter().append("rect")
                .style("fill", function(d, i){return legendThreshold(d[0])})
                .attr({
                    x: (d,i) => legendX(d[0]),
                    y: 0,
                    width: (d,i) => legendX(d[1]) - legendX(d[0]),
                    height: legendHeight
                });

            legend.append("g")
                .attr("transform", "translate(" + 0 + "," + legendHeight + ")")
                .call(legendXAxis);

        });

}

document.addEventListener("DOMContentLoaded", () => d3HeatMapBuilder());