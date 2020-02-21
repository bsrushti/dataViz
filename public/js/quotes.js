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

const updateSMAPeriod = (quotes) => {
  d3.select("#sma-period").on("input", function () {
    analyseData(quotes, +this.value);
  });
};

const SMA = (quotes, index, period = 100) => {
  const hundredQuotes = _.takeRight(_.take(quotes, index), period);
  const closePrices = _.map(hundredQuotes, "Close");
  return _.round(_.sum(closePrices) / period);
};

const analyseData = (quotes, period = 100) => {
  for (let i = period; i <= quotes.length; i++) {
    quotes[i - 1].SMA = SMA(quotes, i, period);
  }
  updatePrices(quotes);
};

const recordTransaction = (quotes, period = 100) => {
  const transactions = [];
  let boughtStocks;
  let stockBought = false;

  for (let i = period; i < quotes.length; i++) {
    const {SMA, Close} = quotes[i];

    if (Close > SMA && !stockBought) {
      stockBought = true;
      boughtStocks = quotes[i];
    }

    if (Close < SMA && stockBought) {
      stockBought = false;
      transactions.push({buy: boughtStocks, sell: quotes[i]});
    }
    if (i === quotes.length - 1 && stockBought) {
      transactions.push({buy: boughtStocks, sell: quotes[i]});
    }
  }
  drawTransactionTable(transactions);
  drawStatisticsTable(transactions);
};

const drawTransactionTable = (transactions) => {
  const columns = ["Buy-date", "Buying Pice", "Sell-date", "Selling Price", "Net Price (Profit)"];
  const table = d3.select("#transaction-table")
    .append("table")
    .attr("class", "table table-hover table-dark table-striped");

  const thead = table.append("thead");
  const tbody = table.append("tbody");

  thead.append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
    .text((c) => c);

  const rows = tbody.selectAll("tr")
    .data(transactions)
    .enter()
    .append("tr");

  const cells = rows.selectAll("td")
    .data(function (row) {
      const rowValues = {
        "Buy-date": row.buy.Date,
        "Buying Pice": Math.round(row.buy.Close),
        "Sell-date": row.sell.Date,
        "Selling Price": Math.round(row.sell.Close),
        "Net Price (Profit)": Math.round(row.sell.Close - row.buy.Close)
      };

      return columns.map(function (column) {
        return {column: column, value: rowValues[column]};
      });
    })
    .enter()
    .append("td")
    .attr("style", "font-family: Courier")
    .html(function (d) {
      return d.value;
    });

  return table;
};

const drawStatisticsTable = (transactions) => {

  const table = d3.select("#statistics-table")
    .append("table")
    .attr("class", "table table-hover table-dark table-striped table-responsive");

  const thead = table.append("thead");
  const tbody = table.append("tbody");

  const totalWins = transactions.filter((t) => t.sell.Close - t.buy.Close > 0);
  const totalProfit = totalWins.map((t) => t.sell.Close - t.buy.Close).reduce((a, b) => a + b);
  const totalProfitAvg = totalProfit / totalWins.length;

  const totalLosses = transactions.filter((t) => t.sell.Close - t.buy.Close < 0);
  const totalLoss = totalLosses.map((t) => t.sell.Close - t.buy.Close).reduce((a, b) => a + b);
  const totalLossAvg = totalLoss / totalLosses.length;

  const net = (q) => q.sell.Close - q.buy.Close;
  const totalNetProfit = transactions.map(net).reduce((a, b) => a + b);


  const data = [
    {
      variable: 'played', 'played': transactions.length
    },
    {
      variable: 'wins', 'wins': totalWins.length
    },
    {
      variable: 'losses', 'losses': totalLosses.length
    },
    {
      variable: 'win %', 'win %': _.round((totalWins.length / transactions.length) * 100, 2)
    },
    {
      variable: 'loss-multiple', 'loss-multiple': _.round(totalLosses.length / totalWins.length,2)
    },
    {
      variable: 'profit-avg', 'profit-avg': Math.round(totalProfitAvg)
    },
    {
      variable: 'loss-avg', 'loss-avg': Math.abs(Math.round(totalLossAvg))
    },
    {
      variable: 'win-multiple', 'win-multiple':Math.abs(_.round((totalProfitAvg / totalLossAvg),2))
    },
    {
      variable: 'total net profit', 'total net profit': Math.round(totalNetProfit)
    },
    {
      variable: 'expectancy', 'expectancy': Math.round(totalProfit / transactions.length)
    },
  ];

  const rows = tbody.selectAll("tr")
    .data(data)
    .enter()
    .append("tr");

  rows.selectAll('th')
    .data(function (row) {
      return [row.variable];
    })
    .enter()
    .append('th')
    .attr('scope', 'row')
    .text(function (d) {
      return d;
    });

  rows.selectAll('td')
    .data(function (row) {
      return [{column: row.variable, value: row[row.variable]}];
    })
    .enter()
    .append('td')
    .text(function (d) {
      return d.value
    });
  return table;
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
    updateSMAPeriod(quotes);
    recordTransaction(quotes);
  });
};

window.onload = main;
