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
  const svg = d3.select('#candle-chart svg');
  const g = svg.select('g');
  const candleG = g.selectAll('g')
    .data(quotes)
    .enter()
    .append('g');


  y = d3.scaleLinear()
    .domain([(_.minBy(quotes, "Low").Low),
      (_.maxBy(quotes, "High").High)])
    .range([height, 0]);

  yAxis = d3.axisLeft(y).tickSize(-width);

  x = d3.scaleBand()
    .range([0, width])
    .domain(_.times(quotes.length))
    .padding(0.3);

  xAxis = d3.axisBottom(x)
    .tickSize(-height)
    .tickFormat(index => quotes[index].Date);

  svg.select(".x-axis").call(xAxis);
  svg.select(".y-axis").call(yAxis);

  const line = candleG.selectAll("g")
    .data(quotes);

  const lines = line.enter()
    .append("line")
    .attr("x1", (q, i) => x(i) + x.bandwidth() / 2)
    .attr("y1", q => y(q.High))
    .attr("x2", (q, i) => x(i) + x.bandwidth() / 2)
    .attr("y2", q => y(q.Low));

  const rectangles = candleG.selectAll("rect")
    .data(quotes);

  const newRects = rectangles.enter()
    .append("rect")
    .classed("positive", (q) => _.max([q.Open, q.Close]) == q.Close)
    .classed("negative", (q) => _.max([q.Open, q.Close]) == q.Open)
    .attr("y", q => y(_.max([q.Open, q.Close])))
    .attr("x", (q, i) => x(i))
    .attr("width", x.bandwidth)
    .attr("height", q => Math.abs(y(q.Close) - y(q.Open)))

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
    drawCandleChart(_.take(quotes, 20));
  });
};

window.onload = main;
