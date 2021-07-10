const chartSize = {width: 1200, height: 650};
const margin = {left: 100, right: 10, top: 30, bottom: 100};
const width = chartSize.width - margin.left - margin.right;

const maxCandles = width / 10;
const candles = _.times(100);
height = chartSize.height - margin.top - margin.bottom;

const initChart = () => {
    const svg = d3.select("#candle-chart svg")
        .attr("width", chartSize.width)
        .attr("height", chartSize.height);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .text("Time");

    g.append("text")
        .attr("class", "y axis-label")
        .attr("x", -height / 2)
        .attr("y", -60)
        .attr("transform", "rotate(-90)")
        .text("Close");

    g.append("g")
        .attr("class", "y-axis");

    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`);

};

const drawCandleChart = (quotes) => {
    const dateFormat = d3.timeParse("%Y-%m-%d");
    for (let i = 0; i < quotes.length; i++) {
        quotes[i]['Date'] = dateFormat(quotes[i]['Date'])
    }

    const svg = d3.select('#candle-chart svg');
    const g = svg.select('g');
    const dates = _.map(quotes, 'Date');
    const candleG = g.selectAll('g')
        .data(quotes)
        .enter()
        .append('g');


    const xmin = d3.min(quotes.map(r => r.Time.getTime()));
    let xmax = d3.max(quotes.map(r => r.Time.getTime()));
    const xScale = d3.scaleLinear().domain([-1, dates.length - 1])
        .range([0, width]);
    const xDateScale = d3.scaleQuantize().domain([0, dates.length]).range(dates)
    const xBand = d3.scaleBand()
        .range([0, width])
        .domain(_.times(quotes.length))
        .padding(0.3);
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d => {
            d = dates[d];
            const hours = d.getHours();
            const minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes()
            const amPM = hours < 13 ? 'am' : 'pm';
            return hours + ':' +
                minutes +
                amPM + ' ' +
                d.getDate() + ' ' +
                d.getMonth() + ' ' +
                d.getFullYear()
        });

    const yScale = d3.scaleLinear()
        .domain([(_.minBy(quotes, "Low").Low),
            (_.maxBy(quotes, "High").High)])
        .range([height, 0]);

    const yAxis = d3.axisLeft(yScale).tickSize(-width);

    const line = candleG.selectAll("g")
        .data(quotes);

    const lines = line.enter()
        .append("line")
        .attr("class", "stem")
        .attr("x1", (q, i) => xBand(i) + xBand.bandwidth() / 2)
        .attr("y1", q => yScale(q.High))
        .attr("x2", (q, i) => xBand(i) + xBand.bandwidth() / 2)
        .attr("y2", q => yScale(q.Low));

    const rectangles = candleG.selectAll(".candles")
        .data(quotes);

    const candles = rectangles.enter()
        .append("rect")
        .attr("class", "candle")
        .classed("positive", (q) => _.max([q.Open, q.Close]) == q.Close)
        .classed("negative", (q) => _.max([q.Open, q.Close]) == q.Open)
        .attr("y", q => yScale(_.max([q.Open, q.Close])))
        .attr("x", (q, i) => xBand(i))
        .attr("width", xBand.bandwidth)
        .attr("height", q => Math.abs(yScale(q.Close) - yScale(q.Open)))

    const wrap = (text, width) => {
        text.each(function () {
            let text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    };

    const zoomed = () => {
        const t = d3.event.transform;
        const xScaleZ = t.rescaleX(xScale);
        const hideTicksWithoutLabel = () => {
            d3.select('.xAxis .tick text').each(d => {
                if (this.innerHTML === '') {
                    this.parentNode.style.display = 'none'
                }
            })
        };

        g.call(
            d3.axisBottom(xScaleZ).tickFormat((d) => {
                if (d >= 0 && dates.length - 1) {
                    d = dates[d];
                    const hours = d.getHours();
                    const minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes()
                    const amPM = hours < 13 ? 'am' : 'pm';
                    return hours + ':' +
                        minutes +
                        amPM + ' ' +
                        d.getDate() + ' ' +
                        d.getMonth() + ' ' +
                        d.getFullYear()
                }
            })
        );

        candles.attr("x", (d, i) => xScaleZ(i) - (xBand.bandwidth() * t.k) / 2)
            .attr("width", xBand.bandwidth() * t.k);

        lines.attr("x1", (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5);
        lines.attr("x2", (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5);
        hideTicksWithoutLabel();
        g.selectAll(".tick text")
            .call(wrap, xBand.bandwidth())
    };

    const zoomend = () => {
        const t = d3.event.transform;
        let xScaleZ = t.rescaleX(xScale);
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(function() {

            var xmin = new Date(xDateScale(Math.floor(xScaleZ.domain()[0])))
            xmax = new Date(xDateScale(Math.floor(xScaleZ.domain()[1])))
            filtered = _.filter(prices, d => ((d.Date >= xmin) && (d.Date <= xmax)))
            minP = +d3.min(filtered, d => d.Low)
            maxP = +d3.max(filtered, d => d.High)
            buffer = Math.floor((maxP - minP) * 0.1)

            yScale.domain([minP - buffer, maxP + buffer])
            candles.transition()
                .duration(800)
                .attr("y", (d) => yScale(Math.max(d.Open, d.Close)))
                .attr("height",  d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close))-yScale(Math.max(d.Open, d.Close)));

            stems.transition().duration(800)
                .attr("y1", (d) => yScale(d.High))
                .attr("y2", (d) => yScale(d.Low))

            gY.transition().duration(800).call(d3.axisLeft().scale(yScale));

        }, 500)

    };

    const extent = [[0, 0], [width, height]];
    const zoom = d3.zoom()
        .scaleExtent([1, 100])
        .translateExtent(extent)
        .extent(extent)
        .on("zoom", zoomed)
        .on('zoom.end', zoomend);

    svg.call(zoom);


    svg.select(".x-axis").call(xAxis);
    svg.select(".y-axis").call(yAxis);

    g.selectAll(".x-axis text")
        .attr("transform", "rotate(-90)")
        .attr("x", -30)
        .attr("y", -4);


};

const main = () => {
    d3.csv('data/nifty50.csv', q => {
        return {
            ...q,
            Close: +q.Close,
            Open: +q.Open,
            High: +q.High,
            Low: +q.Low,
            Time: new Date(q.Date)
        }
    }).then(quotes => {
        initChart();
        drawCandleChart(_.take(quotes, 150));
        // drawCandleChart(quotes);
    });
};

window.onload = main;


//https://bl.ocks.org/davidylam/cbe610a5d68aefa1bda1224588ec35ab
//http://bl.ocks.org/cdagli/728e1f4509671b7de16d5f7f6bfee6f0