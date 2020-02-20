const chartSize = {width: 1200, height: 650};
const margin = {left: 100, right: 10, top: 30, bottom: 100};

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

  g.selectAll(".x-axis text")
    .attr("transform", "rotate(-40)")
    .attr("x", -(height) / 2)
    .attr("y", 10);

};

const updatePrices = (quotes) => {
  const svg = d3.select('#chart-container svg');
  const g = svg.select('g');

  const minDate = _.first(quotes).Time;
  const maxDate = _.last(quotes).Time;

  const y = d3.scaleLinear()
    .domain([(_.minBy(quotes, "Close").Close),
      (_.maxBy(quotes, "Close").Close)])
    .range([height, 0]);

  const yAxis = d3.axisLeft(y);

  const x = d3.scaleTime()
    .range([0, width])
    .domain([new Date(minDate), maxDate]);

  const xAxis = d3.axisBottom(x);

  svg.select('.y.axis-label')
    .text("Close");

  const line = d3.line()
    .x(q => x(q.Time))
    .y(q => y(q.Close));

  const SMALine = d3.line()
    .x(q => x(q.Time))
    .y(q => y(q.SMA));

  g.selectAll("path").remove();

  svg.select(".x-axis").call(xAxis);
  svg.select(".y-axis").call(yAxis);

  g.append("path")
    .attr("class", "close")
    .attr('d', line(quotes));

  g.append("path")
    .attr("class", "avg")
    .attr('d', SMALine(quotes.filter(q => q.SMA)));
};

const SMA = (quotes, index, period = 100) => {
  const hundredQuotes = _.takeRight(_.take(quotes, index), period);
  const closePrices = _.map(hundredQuotes, "Close");
  return closePrices.reduce((a, b) => a + b, 0) / period;
};

const drawSlider = (quotes) => {
  const toLocale = (date) => new Date(date).toLocaleString();
  const minDate = _.first(quotes).Time;
  const maxDate = _.last(quotes).Time;
  const slider = createD3RangeSlider(minDate.getTime(), maxDate.getTime(), "#slider-container");

  slider.onChange(function (newRange) {
    const startDate = newRange.begin;
    const endDate = newRange.end;

    d3.select("#date-range")
      .text(`${toLocale(startDate)} - ${toLocale(endDate)}`);

    const range = quotes.filter(
      (x) => {
        return x.Time.getTime() >= startDate && x.Time.getTime() <= endDate
      });
    updatePrices(range);
  });
  slider.range(minDate.getTime(), maxDate.getTime());
};

const analyseData = (quotes) => {
  for (let i = 100; i < quotes.length; i++) {
    quotes[i].SMA = SMA(quotes, i);
  }
};

const main = () => {
  d3.csv('data/nifty50.csv', q => {
    return {
      ...q,
      Close: +q.Close,
      Time: new Date(q.Date)
    }
  }).then(quotes => {
    analyseData(quotes);
    initChart();
    drawSlider(quotes);
    updatePrices(quotes);
  });
};

window.onload = main;
