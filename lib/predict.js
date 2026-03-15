export function predictSales(data) {
  const n = data.length;

  if (n === 0) return 1;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  data.forEach((y, i) => {
    const x = i + 1;

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  const intercept = (sumY - slope * sumX) / n;

  const nextDay = n + 1;

  const prediction = slope * nextDay + intercept;

  return prediction > 0 ? prediction : 1;
}
