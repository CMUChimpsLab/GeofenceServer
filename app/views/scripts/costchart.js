function drawCostChart() {
    var margin = {top: 20, right: 30, bottom: 30, left: 40},
        width = $("#costs").parent().width() - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = d3.scaleBand()
        .rangeRound([0, width], 0.01)
        .paddingInner(0.05);

    var y = d3.scaleLinear()
        .range([height, 0]);

    var xAxis = d3.axisBottom()
        .scale(x);

    var yAxis = d3.axisLeft()
        .scale(y);

    var chart = d3.select(".costchart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.tsv("costdata.tsv", costtype, function(error, data) {
        if (error) throw error;

        x.domain(data.map(function(d) { return d.cost; }));
        y.domain([0, d3.max(data, function(d) { return d.num; })]);
        
        // ticks for axis
        yAxis.ticks(d3.max(data, function(d) { return d.num; }));

        // x axis
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // y axis
        chart.append("g")
                .attr("class", "y axis")
                .call(yAxis)
            .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Frequency");

        chart.selectAll(".bar")
                .data(data)
            .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d.cost); })
                .attr("width", x.bandwidth())
                .attr("y", function(d) { return y(d.num); })
                .attr("height", function(d) { return height - y(d.num); });
    });
    
}

function costtype(d) {
    d.num = +d.num;     // coerce to number
    return d;
}

drawCostChart();