// Client-side fallback seed data — guarantees instant zero-latency first paint on mobile & desktop

export interface RouteSummary {
  route_id: string; avg_pct_change: number; route_index: number;
  passenger_share: number; passenger_count: number;
  origin: string; destination: string;
  origin_lat: number; origin_lon: number;
  dest_lat: number; dest_lon: number;
}

export interface HeatmapData {
  routes: string[]; horizons: string[];
  z: (number | null)[][]; text: string[][];
  hover: string[][]; weights: number[];
}

export interface MospiRow { date: string; cpi_index: number; inflation_pct: number; }

export const AIRPORTS: Record<string, [number, number]> = {
  DEL: [28.5562, 77.1000], BOM: [19.0896, 72.8656], BLR: [13.1986, 77.7066],
  HYD: [17.2403, 78.4294], MAA: [12.9941, 80.1709], CCU: [22.6547, 88.4467],
  AMD: [23.0734, 72.6347], COK: [10.1520, 76.4019], PNQ: [18.5822, 73.9197],
  GOI: [15.3808, 73.8314], LKO: [26.7606, 80.8893], JAI: [26.8242, 75.8122],
  ATQ: [31.7096, 74.7973], GAU: [26.1061, 91.5859], BBI: [20.2444, 85.8178],
  IXC: [30.6735, 76.7886], IXB: [26.6812, 88.3286], PAT: [25.5913, 85.0880],
  TRV: [8.4821,  76.9201], VTZ: [17.7211, 83.2245],
};

const BASE_PAIRS: [string, string][] = [
  ["DEL","BOM"], ["BOM","DEL"],
  ["DEL","BLR"], ["BLR","DEL"],
  ["BOM","BLR"], ["BLR","BOM"],
  ["HYD","BOM"], ["BOM","HYD"],
  ["DEL","HYD"], ["HYD","DEL"],
  ["DEL","PNQ"], ["PNQ","DEL"],
  ["BOM","PNQ"], ["PNQ","BOM"],
  ["DEL","AMD"], ["AMD","DEL"],
  ["BOM","AMD"], ["AMD","BOM"],
  ["BLR","HYD"], ["HYD","BLR"],
  ["DEL","MAA"], ["MAA","DEL"],
  ["DEL","CCU"], ["CCU","DEL"],
  ["BOM","MAA"], ["MAA","BOM"],
  ["BOM","CCU"], ["CCU","BOM"],
  ["BLR","PNQ"], ["PNQ","BLR"],
  ["BLR","AMD"], ["AMD","BLR"],
  ["BLR","MAA"], ["MAA","BLR"],
  ["BLR","CCU"], ["CCU","BLR"],
  ["HYD","MAA"], ["MAA","HYD"],
  ["HYD","CCU"], ["CCU","HYD"],
  ["HYD","PNQ"], ["PNQ","HYD"],
  ["HYD","AMD"], ["AMD","HYD"],
  ["PNQ","AMD"], ["AMD","PNQ"],
  ["BOM","GOI"], ["GOI","BOM"],
  ["DEL","GOI"], ["GOI","DEL"],
  ["BLR","GOI"], ["GOI","BLR"],
  ["HYD","GOI"], ["GOI","HYD"],
  ["DEL","COK"], ["COK","DEL"],
  ["BOM","COK"], ["COK","BOM"],
  ["BLR","COK"], ["COK","BLR"],
  ["HYD","COK"], ["COK","HYD"],
  ["DEL","JAI"], ["JAI","DEL"],
  ["BOM","JAI"], ["JAI","BOM"],
  ["DEL","LKO"], ["LKO","DEL"],
  ["BOM","LKO"], ["LKO","BOM"],
  ["DEL","IXC"], ["IXC","DEL"],
  ["BOM","IXC"], ["IXC","BOM"],
  ["DEL","PAT"], ["PAT","DEL"],
  ["BOM","PAT"], ["PAT","BOM"],
  ["DEL","GAU"], ["DEL","BBI"]
];

// Realistic Asymmetrical DGCA Passenger Traffic Distribution across 80 Sovereign Corridors
const ROUTE_WEIGHT_VALUES: number[] = (() => {
  const raw: number[] = [];
  for (let i = 0; i < 80; i++) {
    const base_val = 0.048 * (1.0 / (1.0 + 0.05 * i));
    const asym = i % 2 === 0 ? 1.025 : 0.975;
    raw.push(base_val * asym);
  }
  const total = raw.reduce((a, b) => a + b, 0);
  const normalized = raw.map(val => Number((val / total).toFixed(6)));
  const diff = Number((1.0 - normalized.reduce((a, b) => a + b, 0)).toFixed(6));
  normalized[0] = Number((normalized[0] + diff).toFixed(6));
  return normalized;
})();

export const DEFAULT_INDEX: Record<string, number> = {
  "T+1": 138.40,
  "T+7": 114.20,
  "T+15": 105.80,
  "T+30": 98.40,
  "T+45": 86.50
};

export function computeDynamicIndex(
  cabinClass: string,
  aggregation: string,
  airline: string,
  route: string,
  summaries: RouteSummary[] = DEFAULT_ROUTE_SUMMARIES
): Record<string, number> {
  let baseT1 = 138.40;
  let baseT7 = 114.20;
  let baseT15 = 105.80;
  let baseT30 = 98.40;
  let baseT45 = 86.50;

  if (cabinClass === 'Business') {
    baseT1 = 164.20;
    baseT7 = 129.50;
    baseT15 = 117.80;
    baseT30 = 104.20;
    baseT45 = 92.60;
  }

  if (aggregation === 'Airline Specific' && airline !== 'all') {
    const alMultipliers: Record<string, number> = {
      'IndiGo (6E)': -2.8,
      'Air India (AI)': +5.4,
      'SpiceJet (SG)': -0.6,
      'Air India Express (IX)': -1.4,
      'Akasa Air (QP)': -6.5,
    };
    const delta = alMultipliers[airline] ?? 0;
    return {
      'T+1': Number((baseT1 + delta * 1.5).toFixed(2)),
      'T+7': Number((baseT7 + delta).toFixed(2)),
      'T+15': Number((baseT15 + delta * 0.8).toFixed(2)),
      'T+30': Number((baseT30 + delta * 0.5).toFixed(2)),
      'T+45': Number((baseT45 + delta * 0.3).toFixed(2)),
    };
  }

  if (aggregation === 'Route Specific' && route !== 'all') {
    const rSummary = summaries.find(s => s.route_id === route);
    if (rSummary) {
      const delta = rSummary.avg_pct_change - 14.2;
      return {
        'T+1': Number((baseT1 + delta * 1.35).toFixed(2)),
        'T+7': Number((baseT7 + delta).toFixed(2)),
        'T+15': Number((baseT15 + delta * 0.75).toFixed(2)),
        'T+30': Number((baseT30 + delta * 0.5).toFixed(2)),
        'T+45': Number((baseT45 + delta * 0.3).toFixed(2)),
      };
    }
  }

  return {
    'T+1': baseT1,
    'T+7': baseT7,
    'T+15': baseT15,
    'T+30': baseT30,
    'T+45': baseT45,
  };
}

export const DEFAULT_ROUTE_SUMMARIES: RouteSummary[] = BASE_PAIRS.map(([orig, dest], i) => {
  const pshare = ROUTE_WEIGHT_VALUES[i] ?? 0.0125;
  const pcount = Math.round(pshare * 150_000_000);
  const seed = (i * 23 + 17) % 100;
  const avg_pct = -8 + (seed % 28) + Math.sin(i * 0.15) * 4;
  const route_index = 100 + avg_pct;
  const oCoord = AIRPORTS[orig] || [28.5562, 77.1000];
  const dCoord = AIRPORTS[dest] || [19.0896, 72.8656];
  return {
    route_id: `${orig}-${dest}`,
    avg_pct_change: Number(avg_pct.toFixed(2)),
    route_index: Number(route_index.toFixed(1)),
    passenger_share: pshare,
    passenger_count: pcount,
    origin: orig,
    destination: dest,
    origin_lat: oCoord[0],
    origin_lon: oCoord[1],
    dest_lat: dCoord[0],
    dest_lon: dCoord[1],
  };
});

export const DEFAULT_ROUTES_LIST: string[] = BASE_PAIRS.map(([o, d]) => `${o}-${d}`);

export const DEFAULT_HEATMAP: HeatmapData = {
  routes: DEFAULT_ROUTES_LIST,
  horizons: ["T+1", "T+7", "T+15", "T+30", "T+45"],
  z: DEFAULT_ROUTES_LIST.map((_, ri) => [
    35 + (ri % 15) * 2,
    14 + (ri % 10) * 1.5,
    5 + (ri % 8) * 1.2,
    -2 + (ri % 6) * 1.0,
    -12 - (ri % 5) * 1.1
  ]),
  text: DEFAULT_ROUTES_LIST.map((_, ri) => [
    `+${(35 + (ri % 15) * 2).toFixed(1)}%`,
    `+${(14 + (ri % 10) * 1.5).toFixed(1)}%`,
    `+${(5 + (ri % 8) * 1.2).toFixed(1)}%`,
    `${(-2 + (ri % 6) * 1.0).toFixed(1)}%`,
    `${(-12 - (ri % 5) * 1.1).toFixed(1)}%`
  ]),
  hover: DEFAULT_ROUTES_LIST.map((r, ri) => [
    `Route ${r} (T+1): +${(35 + (ri % 15) * 2).toFixed(1)}%`,
    `Route ${r} (T+7): +${(14 + (ri % 10) * 1.5).toFixed(1)}%`,
    `Route ${r} (T+15): +${(5 + (ri % 8) * 1.2).toFixed(1)}%`,
    `Route ${r} (T+30): ${(-2 + (ri % 6) * 1.0).toFixed(1)}%`,
    `Route ${r} (T+45): ${(-12 - (ri % 5) * 1.1).toFixed(1)}%`
  ]),
  weights: ROUTE_WEIGHT_VALUES
};

export const DEFAULT_MOSPI: MospiRow[] = [
  { date: "2010-01-01", cpi_index: 56.30, inflation_pct: 5.0 },
  { date: "2010-02-01", cpi_index: 57.27, inflation_pct: 5.4 },
  { date: "2010-03-01", cpi_index: 57.96, inflation_pct: 5.7 },
  { date: "2010-04-01", cpi_index: 58.43, inflation_pct: 5.9 },
  { date: "2010-05-01", cpi_index: 58.74, inflation_pct: 6.1 },
  { date: "2010-06-01", cpi_index: 58.95, inflation_pct: 6.2 },
  { date: "2010-07-01", cpi_index: 59.15, inflation_pct: 6.2 },
  { date: "2010-08-01", cpi_index: 59.41, inflation_pct: 6.0 },
  { date: "2010-09-01", cpi_index: 59.80, inflation_pct: 5.8 },
  { date: "2010-10-01", cpi_index: 60.35, inflation_pct: 5.5 },
  { date: "2010-11-01", cpi_index: 61.02, inflation_pct: 5.2 },
  { date: "2010-12-01", cpi_index: 61.77, inflation_pct: 4.8 },
  { date: "2011-01-01", cpi_index: 62.52, inflation_pct: 4.5 },
  { date: "2011-02-01", cpi_index: 63.17, inflation_pct: 4.2 },
  { date: "2011-03-01", cpi_index: 63.69, inflation_pct: 4.0 },
  { date: "2011-04-01", cpi_index: 64.03, inflation_pct: 3.8 },
  { date: "2011-05-01", cpi_index: 64.24, inflation_pct: 3.8 },
  { date: "2011-06-01", cpi_index: 64.36, inflation_pct: 3.9 },
  { date: "2011-07-01", cpi_index: 64.47, inflation_pct: 4.1 },
  { date: "2011-08-01", cpi_index: 64.67, inflation_pct: 4.3 },
  { date: "2011-09-01", cpi_index: 64.99, inflation_pct: 4.7 },
  { date: "2011-10-01", cpi_index: 65.48, inflation_pct: 5.0 },
  { date: "2011-11-01", cpi_index: 66.10, inflation_pct: 5.4 },
  { date: "2011-12-01", cpi_index: 66.80, inflation_pct: 5.7 },
  { date: "2012-01-01", cpi_index: 67.50, inflation_pct: 6.0 },
  { date: "2012-02-01", cpi_index: 68.12, inflation_pct: 6.1 },
  { date: "2012-03-01", cpi_index: 68.59, inflation_pct: 6.2 },
  { date: "2012-04-01", cpi_index: 68.90, inflation_pct: 6.2 },
  { date: "2012-05-01", cpi_index: 69.07, inflation_pct: 6.0 },
  { date: "2012-06-01", cpi_index: 69.16, inflation_pct: 5.8 },
  { date: "2012-07-01", cpi_index: 69.24, inflation_pct: 5.5 },
  { date: "2012-08-01", cpi_index: 69.41, inflation_pct: 5.1 },
  { date: "2012-09-01", cpi_index: 69.71, inflation_pct: 4.8 },
  { date: "2012-10-01", cpi_index: 70.17, inflation_pct: 4.5 },
  { date: "2012-11-01", cpi_index: 70.76, inflation_pct: 4.2 },
  { date: "2012-12-01", cpi_index: 71.44, inflation_pct: 3.9 },
  { date: "2013-01-01", cpi_index: 72.11, inflation_pct: 3.8 },
  { date: "2013-02-01", cpi_index: 72.70, inflation_pct: 3.8 },
  { date: "2013-03-01", cpi_index: 73.16, inflation_pct: 3.9 },
  { date: "2013-04-01", cpi_index: 73.45, inflation_pct: 4.1 },
  { date: "2013-05-01", cpi_index: 73.59, inflation_pct: 4.4 },
  { date: "2013-06-01", cpi_index: 73.66, inflation_pct: 4.7 },
  { date: "2013-07-01", cpi_index: 73.73, inflation_pct: 5.0 },
  { date: "2013-08-01", cpi_index: 73.87, inflation_pct: 5.4 },
  { date: "2013-09-01", cpi_index: 74.15, inflation_pct: 5.7 },
  { date: "2013-10-01", cpi_index: 74.60, inflation_pct: 6.0 },
  { date: "2013-11-01", cpi_index: 75.18, inflation_pct: 6.1 },
  { date: "2013-12-01", cpi_index: 75.83, inflation_pct: 6.2 },
  { date: "2014-01-01", cpi_index: 76.49, inflation_pct: 6.2 },
  { date: "2014-02-01", cpi_index: 77.07, inflation_pct: 6.0 },
  { date: "2014-03-01", cpi_index: 77.51, inflation_pct: 5.8 },
  { date: "2014-04-01", cpi_index: 77.78, inflation_pct: 5.5 },
  { date: "2014-05-01", cpi_index: 77.91, inflation_pct: 5.1 },
  { date: "2014-06-01", cpi_index: 77.97, inflation_pct: 4.8 },
  { date: "2014-07-01", cpi_index: 78.02, inflation_pct: 4.4 },
  { date: "2014-08-01", cpi_index: 78.15, inflation_pct: 4.1 },
  { date: "2014-09-01", cpi_index: 78.42, inflation_pct: 3.9 },
  { date: "2014-10-01", cpi_index: 78.85, inflation_pct: 3.8 },
  { date: "2014-11-01", cpi_index: 79.42, inflation_pct: 3.8 },
  { date: "2014-12-01", cpi_index: 80.06, inflation_pct: 3.9 },
  { date: "2015-01-01", cpi_index: 80.71, inflation_pct: 4.1 },
  { date: "2015-02-01", cpi_index: 81.28, inflation_pct: 4.4 },
  { date: "2015-03-01", cpi_index: 81.70, inflation_pct: 4.7 },
  { date: "2015-04-01", cpi_index: 81.96, inflation_pct: 5.1 },
  { date: "2015-05-01", cpi_index: 82.09, inflation_pct: 5.4 },
  { date: "2015-06-01", cpi_index: 82.13, inflation_pct: 5.7 },
  { date: "2015-07-01", cpi_index: 82.17, inflation_pct: 6.0 },
  { date: "2015-08-01", cpi_index: 82.29, inflation_pct: 6.1 },
  { date: "2015-09-01", cpi_index: 82.55, inflation_pct: 6.2 },
  { date: "2015-10-01", cpi_index: 82.97, inflation_pct: 6.2 },
  { date: "2015-11-01", cpi_index: 83.53, inflation_pct: 6.0 },
  { date: "2015-12-01", cpi_index: 84.17, inflation_pct: 5.8 },
  { date: "2016-01-01", cpi_index: 84.80, inflation_pct: 5.5 },
  { date: "2016-02-01", cpi_index: 85.36, inflation_pct: 5.1 },
  { date: "2016-03-01", cpi_index: 85.77, inflation_pct: 4.8 },
  { date: "2016-04-01", cpi_index: 86.03, inflation_pct: 4.4 },
  { date: "2016-05-01", cpi_index: 86.14, inflation_pct: 4.1 },
  { date: "2016-06-01", cpi_index: 86.18, inflation_pct: 3.9 },
  { date: "2016-07-01", cpi_index: 86.21, inflation_pct: 3.8 },
  { date: "2016-08-01", cpi_index: 86.32, inflation_pct: 3.8 },
  { date: "2016-09-01", cpi_index: 86.57, inflation_pct: 3.9 },
  { date: "2016-10-01", cpi_index: 86.98, inflation_pct: 4.1 },
  { date: "2016-11-01", cpi_index: 87.53, inflation_pct: 4.4 },
  { date: "2016-12-01", cpi_index: 88.16, inflation_pct: 4.7 },
  { date: "2017-01-01", cpi_index: 88.79, inflation_pct: 5.1 },
  { date: "2017-02-01", cpi_index: 89.34, inflation_pct: 5.4 },
  { date: "2017-03-01", cpi_index: 89.75, inflation_pct: 5.7 },
  { date: "2017-04-01", cpi_index: 90.00, inflation_pct: 6.0 },
  { date: "2017-05-01", cpi_index: 90.10, inflation_pct: 6.1 },
  { date: "2017-06-01", cpi_index: 90.13, inflation_pct: 6.2 },
  { date: "2017-07-01", cpi_index: 90.16, inflation_pct: 6.1 },
  { date: "2017-08-01", cpi_index: 90.26, inflation_pct: 6.0 },
  { date: "2017-09-01", cpi_index: 90.50, inflation_pct: 5.7 },
  { date: "2017-10-01", cpi_index: 90.91, inflation_pct: 5.4 },
  { date: "2017-11-01", cpi_index: 91.45, inflation_pct: 5.1 },
  { date: "2017-12-01", cpi_index: 92.08, inflation_pct: 4.7 },
  { date: "2018-01-01", cpi_index: 92.70, inflation_pct: 4.4 },
  { date: "2018-02-01", cpi_index: 93.24, inflation_pct: 4.1 },
  { date: "2018-03-01", cpi_index: 93.64, inflation_pct: 3.9 },
  { date: "2018-04-01", cpi_index: 93.88, inflation_pct: 3.8 },
  { date: "2018-05-01", cpi_index: 93.98, inflation_pct: 3.8 },
  { date: "2018-06-01", cpi_index: 94.00, inflation_pct: 3.9 },
  { date: "2018-07-01", cpi_index: 94.02, inflation_pct: 4.1 },
  { date: "2018-08-01", cpi_index: 94.12, inflation_pct: 4.4 },
  { date: "2018-09-01", cpi_index: 94.36, inflation_pct: 4.7 },
  { date: "2018-10-01", cpi_index: 94.76, inflation_pct: 5.1 },
  { date: "2018-11-01", cpi_index: 95.30, inflation_pct: 5.4 },
  { date: "2018-12-01", cpi_index: 95.91, inflation_pct: 5.8 },
  { date: "2019-01-01", cpi_index: 96.53, inflation_pct: 6.0 },
  { date: "2019-02-01", cpi_index: 97.07, inflation_pct: 6.2 },
  { date: "2019-03-01", cpi_index: 97.46, inflation_pct: 6.2 },
  { date: "2019-04-01", cpi_index: 97.70, inflation_pct: 6.1 },
  { date: "2019-05-01", cpi_index: 97.79, inflation_pct: 6.0 },
  { date: "2019-06-01", cpi_index: 97.81, inflation_pct: 5.7 },
  { date: "2019-07-01", cpi_index: 97.82, inflation_pct: 5.4 },
  { date: "2019-08-01", cpi_index: 97.92, inflation_pct: 5.1 },
  { date: "2019-09-01", cpi_index: 98.15, inflation_pct: 4.7 },
  { date: "2019-10-01", cpi_index: 98.54, inflation_pct: 4.4 },
  { date: "2019-11-01", cpi_index: 99.08, inflation_pct: 4.1 },
  { date: "2019-12-01", cpi_index: 99.69, inflation_pct: 3.9 },
  { date: "2020-01-01", cpi_index: 100.00, inflation_pct: 3.8 },
  { date: "2020-02-01", cpi_index: 100.80, inflation_pct: 3.8 },
  { date: "2020-03-01", cpi_index: 98.40, inflation_pct: 3.9 },
  { date: "2020-04-01", cpi_index: 94.20, inflation_pct: 4.1 },
  { date: "2020-05-01", cpi_index: 91.80, inflation_pct: 4.4 },
  { date: "2020-06-01", cpi_index: 91.20, inflation_pct: 4.8 },
  { date: "2020-07-01", cpi_index: 91.90, inflation_pct: 5.1 },
  { date: "2020-08-01", cpi_index: 92.40, inflation_pct: 5.5 },
  { date: "2020-09-01", cpi_index: 92.00, inflation_pct: 5.8 },
  { date: "2020-10-01", cpi_index: 91.80, inflation_pct: 6.0 },
  { date: "2020-11-01", cpi_index: 91.70, inflation_pct: 6.2 },
  { date: "2020-12-01", cpi_index: 92.10, inflation_pct: 6.2 },
  { date: "2021-01-01", cpi_index: 92.60, inflation_pct: 6.1 },
  { date: "2021-02-01", cpi_index: 93.04, inflation_pct: 6.0 },
  { date: "2021-03-01", cpi_index: 93.38, inflation_pct: 5.7 },
  { date: "2021-04-01", cpi_index: 93.62, inflation_pct: 5.4 },
  { date: "2021-05-01", cpi_index: 93.76, inflation_pct: 5.0 },
  { date: "2021-06-01", cpi_index: 93.85, inflation_pct: 4.7 },
  { date: "2021-07-01", cpi_index: 93.95, inflation_pct: 4.4 },
  { date: "2021-08-01", cpi_index: 94.09, inflation_pct: 4.1 },
  { date: "2021-09-01", cpi_index: 94.33, inflation_pct: 3.9 },
  { date: "2021-10-01", cpi_index: 94.67, inflation_pct: 3.8 },
  { date: "2021-11-01", cpi_index: 95.11, inflation_pct: 3.8 },
  { date: "2021-12-01", cpi_index: 95.60, inflation_pct: 3.9 },
  { date: "2022-01-01", cpi_index: 96.45, inflation_pct: 4.2 },
  { date: "2022-02-01", cpi_index: 98.20, inflation_pct: 4.4 },
  { date: "2022-03-01", cpi_index: 99.63, inflation_pct: 4.8 },
  { date: "2022-04-01", cpi_index: 100.86, inflation_pct: 5.1 },
  { date: "2022-05-01", cpi_index: 101.92, inflation_pct: 5.5 },
  { date: "2022-06-01", cpi_index: 102.89, inflation_pct: 5.8 },
  { date: "2022-07-01", cpi_index: 103.83, inflation_pct: 6.0 },
  { date: "2022-08-01", cpi_index: 104.82, inflation_pct: 6.2 },
  { date: "2022-09-01", cpi_index: 105.91, inflation_pct: 6.2 },
  { date: "2022-10-01", cpi_index: 107.12, inflation_pct: 6.1 },
  { date: "2022-11-01", cpi_index: 108.43, inflation_pct: 6.0 },
  { date: "2022-12-01", cpi_index: 109.80, inflation_pct: 5.7 },
  { date: "2023-01-01", cpi_index: 111.05, inflation_pct: 5.4 },
  { date: "2023-02-01", cpi_index: 112.14, inflation_pct: 5.0 },
  { date: "2023-03-01", cpi_index: 113.12, inflation_pct: 4.7 },
  { date: "2023-04-01", cpi_index: 113.96, inflation_pct: 4.3 },
  { date: "2023-05-01", cpi_index: 114.69, inflation_pct: 4.1 },
  { date: "2023-06-01", cpi_index: 115.35, inflation_pct: 3.9 },
  { date: "2023-07-01", cpi_index: 116.00, inflation_pct: 3.8 },
  { date: "2023-08-01", cpi_index: 116.73, inflation_pct: 3.8 },
  { date: "2023-09-01", cpi_index: 117.57, inflation_pct: 3.9 },
  { date: "2023-10-01", cpi_index: 119.81, inflation_pct: 4.2 },
  { date: "2023-11-01", cpi_index: 119.64, inflation_pct: 4.5 },
  { date: "2023-12-01", cpi_index: 120.80, inflation_pct: 4.8 },
  { date: "2024-01-01", cpi_index: 121.85, inflation_pct: 5.2 },
  { date: "2024-02-01", cpi_index: 122.49, inflation_pct: 5.5 },
  { date: "2024-03-01", cpi_index: 122.96, inflation_pct: 5.8 },
  { date: "2024-04-01", cpi_index: 123.25, inflation_pct: 6.0 },
  { date: "2024-05-01", cpi_index: 123.38, inflation_pct: 6.2 },
  { date: "2024-06-01", cpi_index: 123.41, inflation_pct: 6.2 },
  { date: "2024-07-01", cpi_index: 123.44, inflation_pct: 6.1 },
  { date: "2024-08-01", cpi_index: 123.57, inflation_pct: 5.9 },
  { date: "2024-09-01", cpi_index: 123.85, inflation_pct: 5.7 },
  { date: "2024-10-01", cpi_index: 124.33, inflation_pct: 5.4 },
  { date: "2024-11-01", cpi_index: 124.97, inflation_pct: 5.0 },
  { date: "2024-12-01", cpi_index: 125.70, inflation_pct: 4.7 },
  { date: "2025-01-01", cpi_index: 126.30, inflation_pct: 4.3 },
  { date: "2025-02-01", cpi_index: 126.88, inflation_pct: 4.1 },
  { date: "2025-03-01", cpi_index: 127.33, inflation_pct: 3.9 },
  { date: "2025-04-01", cpi_index: 127.61, inflation_pct: 3.8 },
  { date: "2025-05-01", cpi_index: 127.75, inflation_pct: 3.8 },
  { date: "2025-06-01", cpi_index: 127.82, inflation_pct: 4.0 },
  { date: "2025-07-01", cpi_index: 127.88, inflation_pct: 4.2 },
  { date: "2025-08-01", cpi_index: 128.03, inflation_pct: 4.5 },
  { date: "2025-09-01", cpi_index: 128.31, inflation_pct: 4.8 },
  { date: "2025-10-01", cpi_index: 128.75, inflation_pct: 5.2 },
  { date: "2025-11-01", cpi_index: 129.34, inflation_pct: 5.5 },
  { date: "2025-12-01", cpi_index: 130.00, inflation_pct: 5.8 },
  { date: "2026-01-01", cpi_index: 130.45, inflation_pct: 6.0 },
  { date: "2026-02-01", cpi_index: 130.95, inflation_pct: 6.2 },
  { date: "2026-03-01", cpi_index: 131.34, inflation_pct: 6.2 },
  { date: "2026-04-01", cpi_index: 131.59, inflation_pct: 6.1 },
  { date: "2026-05-01", cpi_index: 131.72, inflation_pct: 5.9 },
  { date: "2026-06-01", cpi_index: 131.79, inflation_pct: 5.7 },
  { date: "2026-07-01", cpi_index: 131.86, inflation_pct: 5.3 },
  { date: "2026-08-01", cpi_index: 131.99, inflation_pct: 5.0 },
  { date: "2026-09-01", cpi_index: 132.25, inflation_pct: 4.6 },
  { date: "2026-10-01", cpi_index: 132.63, inflation_pct: 4.3 },
  { date: "2026-11-01", cpi_index: 133.13, inflation_pct: 4.1 },
  { date: "2026-12-01", cpi_index: 133.70, inflation_pct: 3.9 }
];

export const DEFAULT_ANOMALIES: any = {
  total_anomalies: 8,
  critical_count: 3,
  high_count: 3,
  moderate_count: 2,
  iqr_stats: { q1: 4200, q3: 6500, iqr: 2300, upper_bound: 9950 },
  anomalies: [
    {
      route_id: "DEL-BOM", origin: "DEL", destination: "BOM", airline: "IndiGo (6E)",
      horizon: "T+1", cabin_class: "Economy", fare_current: 12450, fare_base: 5200,
      pct_change: 139.4, surge_multiplier: 2.39, severity: "CRITICAL",
      passenger_share: 0.124, passenger_count: 18600000
    },
    {
      route_id: "DEL-BLR", origin: "DEL", destination: "BLR", airline: "Air India (AI)",
      horizon: "T+1", cabin_class: "Economy", fare_current: 14800, fare_base: 6100,
      pct_change: 142.6, surge_multiplier: 2.43, severity: "CRITICAL",
      passenger_share: 0.098, passenger_count: 14700000
    },
    {
      route_id: "BOM-GOI", origin: "BOM", destination: "GOI", airline: "SpiceJet (SG)",
      horizon: "T+1", cabin_class: "Economy", fare_current: 9800, fare_base: 4100,
      pct_change: 139.0, surge_multiplier: 2.39, severity: "CRITICAL",
      passenger_share: 0.055, passenger_count: 8250000
    },
    {
      route_id: "DEL-HYD", origin: "DEL", destination: "HYD", airline: "IndiGo (6E)",
      horizon: "T+7", cabin_class: "Economy", fare_current: 8200, fare_base: 4800,
      pct_change: 70.8, surge_multiplier: 1.71, severity: "HIGH",
      passenger_share: 0.072, passenger_count: 10800000
    },
    {
      route_id: "BOM-BLR", origin: "BOM", destination: "BLR", airline: "Akasa Air (QP)",
      horizon: "T+7", cabin_class: "Economy", fare_current: 7400, fare_base: 4500,
      pct_change: 64.4, surge_multiplier: 1.64, severity: "HIGH",
      passenger_share: 0.065, passenger_count: 9750000
    }
  ]
};

export const DEFAULT_COMPETITION: any = {
  national_avg_hhi: 2840,
  total_routes_analyzed: 80,
  high_concentration_routes: 14,
  routes: DEFAULT_ROUTES_LIST.map((r, i) => ({
    route_id: r,
    hhi: 1800 + ((i * 137) % 2400),
    market_type: (1800 + ((i * 137) % 2400)) > 2500 ? "Highly Concentrated (HHI > 2500)" : "Moderately Concentrated (1500–2500)",
    badge_color: (1800 + ((i * 137) % 2400)) > 2500 ? "#EF4444" : "#F59E0B",
    dominant_airline: i % 3 === 0 ? "IndiGo (6E)" : i % 3 === 1 ? "Air India (AI)" : "SpiceJet (SG)",
    dominant_share_pct: 45 + (i % 35),
    carrier_count: 2 + (i % 3),
    avg_fare_current: 5400 + (i * 50),
    avg_fare_base: 4800 + (i * 30),
    avg_pct_change: 8 + (i % 20),
    carriers: [
      { airline: "IndiGo (6E)", flights: 12, share_pct: 55 },
      { airline: "Air India (AI)", flights: 6, share_pct: 30 },
      { airline: "SpiceJet (SG)", flights: 3, share_pct: 15 }
    ]
  }))
};

