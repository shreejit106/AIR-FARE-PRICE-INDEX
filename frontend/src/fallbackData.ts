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
  { date: "2010-01-01", cpi_index: 101.2, inflation_pct: 5.0 },
  { date: "2010-02-01", cpi_index: 102.6, inflation_pct: 5.0 },
  { date: "2010-03-01", cpi_index: 103.6, inflation_pct: 5.0 },
  { date: "2010-04-01", cpi_index: 104.8, inflation_pct: 5.0 },
  { date: "2010-05-01", cpi_index: 106.2, inflation_pct: 5.0 },
  { date: "2010-06-01", cpi_index: 107.2, inflation_pct: 5.0 },
  { date: "2010-07-01", cpi_index: 108.4, inflation_pct: 5.0 },
  { date: "2010-08-01", cpi_index: 109.8, inflation_pct: 5.0 },
  { date: "2010-09-01", cpi_index: 110.8, inflation_pct: 5.0 },
  { date: "2010-10-01", cpi_index: 112.0, inflation_pct: 5.0 },
  { date: "2010-11-01", cpi_index: 113.4, inflation_pct: 5.0 },
  { date: "2010-12-01", cpi_index: 114.4, inflation_pct: 5.0 },
  { date: "2011-01-01", cpi_index: 115.7, inflation_pct: 5.0 },
  { date: "2011-02-01", cpi_index: 117.2, inflation_pct: 5.0 },
  { date: "2011-03-01", cpi_index: 118.3, inflation_pct: 5.0 },
  { date: "2011-04-01", cpi_index: 119.6, inflation_pct: 5.0 },
  { date: "2011-05-01", cpi_index: 121.1, inflation_pct: 5.0 },
  { date: "2011-06-01", cpi_index: 122.2, inflation_pct: 5.0 },
  { date: "2011-07-01", cpi_index: 123.5, inflation_pct: 5.0 },
  { date: "2011-08-01", cpi_index: 125.0, inflation_pct: 5.0 },
  { date: "2011-09-01", cpi_index: 126.1, inflation_pct: 5.0 },
  { date: "2011-10-01", cpi_index: 127.4, inflation_pct: 5.0 },
  { date: "2011-11-01", cpi_index: 128.9, inflation_pct: 5.0 },
  { date: "2011-12-01", cpi_index: 130.0, inflation_pct: 5.0 },
  { date: "2012-01-01", cpi_index: 131.4, inflation_pct: 5.0 },
  { date: "2012-02-01", cpi_index: 133.0, inflation_pct: 5.0 },
  { date: "2012-03-01", cpi_index: 134.2, inflation_pct: 5.0 },
  { date: "2012-04-01", cpi_index: 135.6, inflation_pct: 5.0 },
  { date: "2012-05-01", cpi_index: 137.2, inflation_pct: 5.0 },
  { date: "2012-06-01", cpi_index: 138.4, inflation_pct: 5.0 },
  { date: "2012-07-01", cpi_index: 139.8, inflation_pct: 5.0 },
  { date: "2012-08-01", cpi_index: 141.4, inflation_pct: 5.0 },
  { date: "2012-09-01", cpi_index: 142.6, inflation_pct: 5.0 },
  { date: "2012-10-01", cpi_index: 144.0, inflation_pct: 5.0 },
  { date: "2012-11-01", cpi_index: 145.6, inflation_pct: 5.0 },
  { date: "2012-12-01", cpi_index: 146.8, inflation_pct: 5.0 },
  { date: "2013-01-01", cpi_index: 148.3, inflation_pct: 5.0 },
  { date: "2013-02-01", cpi_index: 150.0, inflation_pct: 5.0 },
  { date: "2013-03-01", cpi_index: 151.3, inflation_pct: 5.0 },
  { date: "2013-04-01", cpi_index: 152.8, inflation_pct: 5.0 },
  { date: "2013-05-01", cpi_index: 154.5, inflation_pct: 5.0 },
  { date: "2013-06-01", cpi_index: 155.8, inflation_pct: 5.0 },
  { date: "2013-07-01", cpi_index: 157.3, inflation_pct: 5.0 },
  { date: "2013-08-01", cpi_index: 159.0, inflation_pct: 5.0 },
  { date: "2013-09-01", cpi_index: 160.3, inflation_pct: 5.0 },
  { date: "2013-10-01", cpi_index: 161.8, inflation_pct: 5.0 },
  { date: "2013-11-01", cpi_index: 163.5, inflation_pct: 5.0 },
  { date: "2013-12-01", cpi_index: 164.8, inflation_pct: 5.0 },
  { date: "2014-01-01", cpi_index: 166.4, inflation_pct: 5.0 },
  { date: "2014-02-01", cpi_index: 168.2, inflation_pct: 5.0 },
  { date: "2014-03-01", cpi_index: 169.6, inflation_pct: 5.0 },
  { date: "2014-04-01", cpi_index: 171.2, inflation_pct: 5.0 },
  { date: "2014-05-01", cpi_index: 173.0, inflation_pct: 5.0 },
  { date: "2014-06-01", cpi_index: 174.4, inflation_pct: 5.0 },
  { date: "2014-07-01", cpi_index: 176.0, inflation_pct: 5.0 },
  { date: "2014-08-01", cpi_index: 177.8, inflation_pct: 5.0 },
  { date: "2014-09-01", cpi_index: 179.2, inflation_pct: 5.0 },
  { date: "2014-10-01", cpi_index: 180.8, inflation_pct: 5.0 },
  { date: "2014-11-01", cpi_index: 182.6, inflation_pct: 5.0 },
  { date: "2014-12-01", cpi_index: 184.0, inflation_pct: 5.0 },
  { date: "2015-01-01", cpi_index: 185.7, inflation_pct: 5.0 },
  { date: "2015-02-01", cpi_index: 187.6, inflation_pct: 5.0 },
  { date: "2015-03-01", cpi_index: 189.1, inflation_pct: 5.0 },
  { date: "2015-04-01", cpi_index: 190.8, inflation_pct: 5.0 },
  { date: "2015-05-01", cpi_index: 192.7, inflation_pct: 5.0 },
  { date: "2015-06-01", cpi_index: 194.2, inflation_pct: 5.0 },
  { date: "2015-07-01", cpi_index: 195.9, inflation_pct: 5.0 },
  { date: "2015-08-01", cpi_index: 197.8, inflation_pct: 5.0 },
  { date: "2015-09-01", cpi_index: 199.3, inflation_pct: 5.0 },
  { date: "2015-10-01", cpi_index: 201.0, inflation_pct: 5.0 },
  { date: "2015-11-01", cpi_index: 202.9, inflation_pct: 5.0 },
  { date: "2015-12-01", cpi_index: 204.4, inflation_pct: 5.0 },
  { date: "2016-01-01", cpi_index: 206.2, inflation_pct: 5.0 },
  { date: "2016-02-01", cpi_index: 208.2, inflation_pct: 5.0 },
  { date: "2016-03-01", cpi_index: 209.8, inflation_pct: 5.0 },
  { date: "2016-04-01", cpi_index: 211.6, inflation_pct: 5.0 },
  { date: "2016-05-01", cpi_index: 213.6, inflation_pct: 5.0 },
  { date: "2016-06-01", cpi_index: 215.2, inflation_pct: 5.0 },
  { date: "2016-07-01", cpi_index: 217.0, inflation_pct: 5.0 },
  { date: "2016-08-01", cpi_index: 219.0, inflation_pct: 5.0 },
  { date: "2016-09-01", cpi_index: 220.6, inflation_pct: 5.0 },
  { date: "2016-10-01", cpi_index: 222.4, inflation_pct: 5.0 },
  { date: "2016-11-01", cpi_index: 224.4, inflation_pct: 5.0 },
  { date: "2016-12-01", cpi_index: 226.0, inflation_pct: 5.0 },
  { date: "2017-01-01", cpi_index: 227.9, inflation_pct: 5.0 },
  { date: "2017-02-01", cpi_index: 230.0, inflation_pct: 5.0 },
  { date: "2017-03-01", cpi_index: 231.7, inflation_pct: 5.0 },
  { date: "2017-04-01", cpi_index: 233.6, inflation_pct: 5.0 },
  { date: "2017-05-01", cpi_index: 235.7, inflation_pct: 5.0 },
  { date: "2017-06-01", cpi_index: 237.4, inflation_pct: 5.0 },
  { date: "2017-07-01", cpi_index: 239.3, inflation_pct: 5.0 },
  { date: "2017-08-01", cpi_index: 241.4, inflation_pct: 5.0 },
  { date: "2017-09-01", cpi_index: 243.1, inflation_pct: 5.0 },
  { date: "2017-10-01", cpi_index: 245.0, inflation_pct: 5.0 },
  { date: "2017-11-01", cpi_index: 247.1, inflation_pct: 5.0 },
  { date: "2017-12-01", cpi_index: 248.8, inflation_pct: 5.0 },
  { date: "2018-01-01", cpi_index: 250.8, inflation_pct: 5.0 },
  { date: "2018-02-01", cpi_index: 253.0, inflation_pct: 5.0 },
  { date: "2018-03-01", cpi_index: 254.8, inflation_pct: 5.0 },
  { date: "2018-04-01", cpi_index: 256.8, inflation_pct: 5.0 },
  { date: "2018-05-01", cpi_index: 259.0, inflation_pct: 5.0 },
  { date: "2018-06-01", cpi_index: 260.8, inflation_pct: 5.0 },
  { date: "2018-07-01", cpi_index: 262.8, inflation_pct: 5.0 },
  { date: "2018-08-01", cpi_index: 265.0, inflation_pct: 5.0 },
  { date: "2018-09-01", cpi_index: 266.8, inflation_pct: 5.0 },
  { date: "2018-10-01", cpi_index: 268.8, inflation_pct: 5.0 },
  { date: "2018-11-01", cpi_index: 271.0, inflation_pct: 5.0 },
  { date: "2018-12-01", cpi_index: 272.8, inflation_pct: 5.0 },
  { date: "2019-01-01", cpi_index: 274.9, inflation_pct: 5.0 },
  { date: "2019-02-01", cpi_index: 277.2, inflation_pct: 5.0 },
  { date: "2019-03-01", cpi_index: 279.1, inflation_pct: 5.0 },
  { date: "2019-04-01", cpi_index: 281.2, inflation_pct: 5.0 },
  { date: "2019-05-01", cpi_index: 283.5, inflation_pct: 5.0 },
  { date: "2019-06-01", cpi_index: 285.4, inflation_pct: 5.0 },
  { date: "2019-07-01", cpi_index: 287.5, inflation_pct: 5.0 },
  { date: "2019-08-01", cpi_index: 289.8, inflation_pct: 5.0 },
  { date: "2019-09-01", cpi_index: 291.7, inflation_pct: 5.0 },
  { date: "2019-10-01", cpi_index: 293.8, inflation_pct: 5.0 },
  { date: "2019-11-01", cpi_index: 296.1, inflation_pct: 5.0 },
  { date: "2019-12-01", cpi_index: 298.0, inflation_pct: 5.0 },
  { date: "2020-01-01", cpi_index: 300.2, inflation_pct: 5.0 },
  { date: "2020-02-01", cpi_index: 302.6, inflation_pct: 5.0 },
  { date: "2020-03-01", cpi_index: 304.6, inflation_pct: 5.0 },
  { date: "2020-04-01", cpi_index: 306.8, inflation_pct: 5.0 },
  { date: "2020-05-01", cpi_index: 309.2, inflation_pct: 5.0 },
  { date: "2020-06-01", cpi_index: 311.2, inflation_pct: 5.0 },
  { date: "2020-07-01", cpi_index: 313.4, inflation_pct: 5.0 },
  { date: "2020-08-01", cpi_index: 315.8, inflation_pct: 5.0 },
  { date: "2020-09-01", cpi_index: 317.8, inflation_pct: 5.0 },
  { date: "2020-10-01", cpi_index: 320.0, inflation_pct: 5.0 },
  { date: "2020-11-01", cpi_index: 322.4, inflation_pct: 5.0 },
  { date: "2020-12-01", cpi_index: 324.4, inflation_pct: 5.0 },
  { date: "2021-01-01", cpi_index: 326.7, inflation_pct: 5.0 },
  { date: "2021-02-01", cpi_index: 329.2, inflation_pct: 5.0 },
  { date: "2021-03-01", cpi_index: 331.3, inflation_pct: 5.0 },
  { date: "2021-04-01", cpi_index: 333.6, inflation_pct: 5.0 },
  { date: "2021-05-01", cpi_index: 336.1, inflation_pct: 5.0 },
  { date: "2021-06-01", cpi_index: 338.2, inflation_pct: 5.0 },
  { date: "2021-07-01", cpi_index: 340.5, inflation_pct: 5.0 },
  { date: "2021-08-01", cpi_index: 343.0, inflation_pct: 5.0 },
  { date: "2021-09-01", cpi_index: 345.1, inflation_pct: 5.0 },
  { date: "2021-10-01", cpi_index: 347.4, inflation_pct: 5.0 },
  { date: "2021-11-01", cpi_index: 349.9, inflation_pct: 5.0 },
  { date: "2021-12-01", cpi_index: 352.0, inflation_pct: 5.0 },
  { date: "2022-01-01", cpi_index: 354.4, inflation_pct: 5.0 },
  { date: "2022-02-01", cpi_index: 357.0, inflation_pct: 5.0 },
  { date: "2022-03-01", cpi_index: 359.2, inflation_pct: 5.0 },
  { date: "2022-04-01", cpi_index: 361.6, inflation_pct: 5.0 },
  { date: "2022-05-01", cpi_index: 364.2, inflation_pct: 5.0 },
  { date: "2022-06-01", cpi_index: 366.4, inflation_pct: 5.0 },
  { date: "2022-07-01", cpi_index: 368.8, inflation_pct: 5.0 },
  { date: "2022-08-01", cpi_index: 371.4, inflation_pct: 5.0 },
  { date: "2022-09-01", cpi_index: 373.6, inflation_pct: 5.0 },
  { date: "2022-10-01", cpi_index: 376.0, inflation_pct: 5.0 },
  { date: "2022-11-01", cpi_index: 378.6, inflation_pct: 5.0 },
  { date: "2022-12-01", cpi_index: 380.8, inflation_pct: 5.0 },
  { date: "2023-01-01", cpi_index: 383.3, inflation_pct: 5.0 },
  { date: "2023-02-01", cpi_index: 386.0, inflation_pct: 5.0 },
  { date: "2023-03-01", cpi_index: 388.3, inflation_pct: 5.0 },
  { date: "2023-04-01", cpi_index: 390.8, inflation_pct: 5.0 },
  { date: "2023-05-01", cpi_index: 393.5, inflation_pct: 5.0 },
  { date: "2023-06-01", cpi_index: 395.8, inflation_pct: 5.0 },
  { date: "2023-07-01", cpi_index: 398.3, inflation_pct: 5.0 },
  { date: "2023-08-01", cpi_index: 401.0, inflation_pct: 5.0 },
  { date: "2023-09-01", cpi_index: 403.3, inflation_pct: 5.0 },
  { date: "2023-10-01", cpi_index: 405.8, inflation_pct: 5.0 },
  { date: "2023-11-01", cpi_index: 408.5, inflation_pct: 5.0 },
  { date: "2023-12-01", cpi_index: 410.8, inflation_pct: 5.0 },
  { date: "2024-01-01", cpi_index: 413.4, inflation_pct: 5.0 },
  { date: "2024-02-01", cpi_index: 416.2, inflation_pct: 5.0 },
  { date: "2024-03-01", cpi_index: 418.6, inflation_pct: 5.0 },
  { date: "2024-04-01", cpi_index: 421.2, inflation_pct: 5.0 },
  { date: "2024-05-01", cpi_index: 424.0, inflation_pct: 5.0 },
  { date: "2024-06-01", cpi_index: 426.4, inflation_pct: 5.0 },
  { date: "2024-07-01", cpi_index: 429.0, inflation_pct: 5.0 },
  { date: "2024-08-01", cpi_index: 431.8, inflation_pct: 5.0 },
  { date: "2024-09-01", cpi_index: 434.2, inflation_pct: 5.0 },
  { date: "2024-10-01", cpi_index: 436.8, inflation_pct: 5.0 },
  { date: "2024-11-01", cpi_index: 439.6, inflation_pct: 5.0 },
  { date: "2024-12-01", cpi_index: 442.0, inflation_pct: 5.0 }
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

