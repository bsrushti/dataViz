const chartSize = {width: 800, height: 600};
const margin = {left: 100, right: 10, top: 30, bottom: 150};

const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const formats = {
  Rs:d=>`${d} ₹`,
  kCrRs:d=>`${d/1000}k Cr ₹`,
  PE:d=>d
};

const fieldNameFormat = {
  CMP : formats.Rs,
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

  const colorScale = d3.scaleOrdinal([
    DARK_BLUE,
    DULL_BLUE,
    BRIGHT_BLUE,
    LIGHT_BLUE,
    BABY_BLUE,
    PALE_BLUE,
    BLUE_JEANS
  ]);

  const svg = d3.select("#chart-container svg")
    .attr("width", chartSize.width)
    .attr("height", chartSize.height);

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

  const rectangles = g.selectAll("rect")
    .data(companies);

  const newRects = rectangles.enter()
    .append("rect")
    .attr("y", c => y(c[fieldName]))
    .attr("x", c => x(c.Name))
    .attr("width", x.bandwidth)
    .attr("height", c => y(0) - y(c[fieldName]))
    .attr("fill", c => colorScale(c.Name));

  const yAxis = d3.axisLeft(y).tickFormat(c => c + "₹").ticks(6);
  const xAxis = d3.axisBottom(x);

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
  const y = d3.scaleLinear()
    .domain([0, (_.maxBy(companies, fieldName)[fieldName])])
    .range([height, 0]);

  const svg = d3.select('#chart-container svg');

  svg.select('.y.axis-label')
    .text(fieldName);

  const yAxis = d3
    .axisLeft(y)
    .tickFormat(fieldNameFormat[fieldName])
    .ticks(12);

  svg.select('.y-axis')
    .call(yAxis);

  svg.selectAll('rect')
    .data(companies)
    .transition()
    .duration(500)
    .ease(d3.easeLinear)
    .attr("y", c => y(c[fieldName]))
    .attr('height', c => y(0) - y(c[fieldName]));
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
  });
};

window.onload = main;
