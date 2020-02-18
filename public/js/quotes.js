const chartSize = {width: 800, height: 600};
const margin = {left: 100, right: 10, top: 30, bottom: 150};

const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const initChart = () => {
  const svg = d3.select("#chart-container svg")
    .attr("width", chartSize.width)
    .attr("height", chartSize.height);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 140)
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

  g.selectAll(".x-axis text")
    .attr("transform", "rotate(-40)")
    .attr("x", -(height) / 2)
    .attr("y", 10);

};

const updatePrices = (quotes) => {
  const svg = d3.select('#chart-container svg');
  const g = svg.select('g');

  const minDate = _.first(quotes).Date;
  const maxDate = _.last(quotes).Date;

  const y = d3.scaleLinear()
    .domain([(_.minBy(quotes, "Close").Close),
      (_.maxBy(quotes, "Close").Close)])
    .range([height, 0]);

  const yAxis = d3
    .axisLeft(y);
  svg.select(".y-axis").call(yAxis);

  const x = d3.scaleTime()
    .range([0, width])
    .domain([new Date(minDate), new Date(maxDate)]);

  const xAxis = d3.axisBottom(x);
  svg.select(".x-axis").call(xAxis);

  svg.select('.y.axis-label')
    .text("Close");

  const line = d3.line()
    .x(q => x(new Date(q.Date)))
    .y(q => y(q.Close));

  g.append("path")
    .attr("class", "close")
    .attr('d', line(quotes));

};
const main = () => {
  d3.csv('data/nifty50.csv', e => {
    return {
      ...e,
      Close: +e.Close,
    }
  }).then(quotes => {
    initChart();
    updatePrices(quotes);
  });
};

window.onload = main;
