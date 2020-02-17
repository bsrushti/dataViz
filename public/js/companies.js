const chartSize = {width: 800, height: 600};
const margin = {left: 100, right: 10, top: 30, bottom: 150};

const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const colorScale = d3.scaleOrdinal([
  '#182D57',
  '#203F6C',
  '#227BB1',
  '#57B2E3',
  '#8ED0F2',
  '#B8E1FB',
  '#5CB7F4'
]);

const formats = {
  Rs: d => `${d} ₹`,
  kCrRs: d => `${d / 1000}k Cr ₹`,
  PE: d => d
};

const fieldNameFormat = {
  CMP: formats.Rs,
  MarketCap: formats.kCrRs,
  PE: formats.PE
};

const drawCompanies = (companies, fieldName) => {

  const y = d3.scaleLinear()
    .domain([0, (_.maxBy(companies, fieldName)[fieldName])])
    .range([height, 0]);

  const x = d3.scaleBand()
    .range([0, width])
    .domain(_.map(companies, "Name"))
    .padding(0.3);

  const svg = d3.select("#chart-container svg")
    .attr("width", chartSize.width)
    .attr("height", chartSize.height);

  const yAxis = d3.axisLeft(y).tickFormat(c => c + "₹").ticks(6);
  const xAxis = d3.axisBottom(x);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .text("CMP Names");

  g.append("text")
    .attr("class", "y axis-label")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("transform", "rotate(-90)")
    .text(fieldName);

  g.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

  g.selectAll(".x-axis text")
    .attr("transform", "rotate(-40)")
    .attr("x", -5)
    .attr("y", 10);
};

const updateCompanies = (companies, fieldName) => {
  const svg = d3.select('#chart-container svg');
  const rectangleG = svg.select('g');
  const rectangles = rectangleG.selectAll('rect').data(companies, c => c.Name);

  const y = d3.scaleLinear()
    .domain([0, (_.maxBy(companies, fieldName)[fieldName])])
    .range([height, 0]);
  const yAxis = d3
    .axisLeft(y)
    .tickFormat(fieldNameFormat[fieldName])
    .ticks(12);
  svg.select(".y-axis").call(yAxis);

  const x = d3.scaleBand()
    .range([0, width])
    .domain(_.map(companies, "Name"))
    .padding(0.3);
  const xAxis = d3.axisBottom(x);
  svg.select(".x-axis").call(xAxis);

  svg.select('.y.axis-label')
    .text(fieldName);

  const t = d3
    .transition()
    .duration(1000)
    .ease(d3.easeLinear);

  rectangles
    .exit()
    .remove();

  rectangles
    .enter()
    .append('rect')
    .attr("fill", b => colorScale(b.Name))
    .attr("x", c => x(c.Name))
    .attr("y", c => y(0))
    .merge(rectangles)
    .transition(t)
    .attr("x", c => x(c.Name))
    .attr("y", c => y(c[fieldName]))
    .attr("width", x.bandwidth)
    .attr("height", c => y(0) - y(c[fieldName]));
};

const frequentlyMoveCompanies = (src, dest) => {
  setInterval(() => {
    const c = src.shift();
    if (c) dest.push(c);
    else [src, dest] = [dest, src];
  }, 2000);
};

const main = () => {
  d3.csv('data/companies.csv', c => {
    return {
      ...c,
      CMP: +c.CMP,
      PE: +c.PE,
      MarketCap: +c.MarketCap
    }
  }).then(c => {
    const fieldNames = ["CMP", "PE", "MarketCap"];
    let index = 0;
    drawCompanies(c, fieldNames[index]);
    setInterval(() => {
      index = ++index % fieldNames.length;
      updateCompanies(c, fieldNames[index]);
    }, 2000);
    frequentlyMoveCompanies(c, []);
  });
};

window.onload = main;
