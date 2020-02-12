const drawCompanies = (companies) => {
  console.log(companies);

  const chartSize = {width: 800, height: 600};
  const margin = {left: 100, right: 10, top: 30, bottom: 150};

  const width = chartSize.width - margin.left - margin.right;
  const height = chartSize.height - margin.top - margin.bottom;

  const y = d3.scaleLinear()
    .domain([0, (_.maxBy(companies, "CMP").CMP)])
    .range([height, 0]);

  const x = d3.scaleBand()
    .range([0, width])
    .domain(_.map(companies, "Name"))
    .padding(0.3);

  const svg = d3.select("#chart-container")
    .append("svg")
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
    .attr("class", "axis-label")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("transform", "rotate(-90)")
    .text("CMP₹");

  const rectangles = g.selectAll("rect")
    .data(companies);

  const newRects = rectangles.enter()
    .append("rect")
    .attr("y", c => y(c.CMP))
    .attr("x", c => x(c.Name))
    .attr("width", x.bandwidth)
    .attr("height", c => y(0) - y(c.CMP));

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
    .attr("x", - 5)
    .attr("y", 10)

};

const main = () => {
  d3.csv('data/companies.csv', c => {return {...c, CMP : +c.CMP}
  }).then(drawCompanies);
};

window.onload = main;
