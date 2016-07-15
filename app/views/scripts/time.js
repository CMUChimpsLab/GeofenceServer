function drawTimeChart() {
    var margin = {top: 20, right: 30, bottom: 30, left: 40},
    width = $("#costs").parent().width() - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var x = d3.scaleLinear()
        .range([0, width]);
    
    var y = d3.scaleLinear()
        .range([height, 0]);
    
    var line = d3.line()
        .x(function(d) { return x(d.hour); })
        .y(function(d) { return y(d.num); });

    var graph = d3.select(".timegraph")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.tsv("timedata.tsv", timetype, function(error, rawData) {
        if (error) throw error;
        
        // extract the hours information
        var transdata = [], data = [];
        for (var i = 0; i < 24; i++) transdata[i] = 0;
        rawData.map(function(d) { transdata[d.hours]++; });
        for (var i = 0; i < 24; i++) {
            data.push({
                hour: i,
                num: transdata[i]
            });
        }
        
        x.domain(d3.extent(data, function(d) { return d.hour; }));
        y.domain(d3.extent(data, function(d) { return d.num; }));
        
        // axis
        graph.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).ticks(24));

        graph.append("g")
                .attr("class", "axis axis--y")
                .call(d3.axisLeft(y).ticks(d3.max(data, function(d) { return d.num; })))
            .append("text")
                .attr("class", "axis-title")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Number of Tasks");

        graph.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);
    });
}

function timetype(d) {
    d.createdAt = new Date(Date.parse(d.createdAt));
    d.hours = new Date(Date.parse(d.createdAt) + 18e5).getHours();  // round to whole hour
    return d;
}

drawTimeChart();