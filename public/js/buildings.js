const drawBuildings = (buildings) => {
  const toLine = b => `<strong>${b.name}</strong> <i>${b.height}</i>`;
  // document.querySelector('#chart-area').innerHTML = buildings.map(toLine).join('<hr/>');

  const SVG_WIDTH = 400;
  const SVG_HEIGHT = 400;

  build = buildings;

  const y = d3.scaleLinear()
    .domain([0, (_.maxBy(buildings, "height").height)])
    .range([0, SVG_HEIGHT]);

  const x = d3.scaleBand()
    .range([0, SVG_WIDTH])
    .domain(_.map(buildings, "name"))
    .padding(0.3);

  const svg = d3.select("#chart-container")
    .append("svg")
    .attr("width", SVG_WIDTH)
    .attr("height", SVG_HEIGHT);

  const rectangles = svg.selectAll("rect")
    .data(buildings);

  const newRects = rectangles.enter()
    .append("rect")
    .attr("y", 0)
    .attr("x", b => x(b.name))
    .attr("width", x.bandwidth)
    .attr("height", b => y(b.height))
};

const main = () => {
  d3.json('data/buildings.json').then(drawBuildings);
};

window.onload = main;
