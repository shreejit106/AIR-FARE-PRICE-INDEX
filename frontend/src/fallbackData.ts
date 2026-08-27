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
  ["DEL","BOM"], ["DEL","BLR"], ["BOM","BLR"], ["DEL","HYD"], ["BOM","GOI"],
  ["DEL","MAA"], ["DEL","CCU"], ["BOM","MAA"], ["BLR","HYD"], ["DEL","AMD"],
  ["BOM","HYD"], ["BLR","MAA"], ["DEL","PNQ"], ["BOM","CCU"], ["DEL","COK"],
  ["BLR","CCU"], ["BOM","AMD"], ["HYD","MAA"], ["DEL","JAI"], ["BOM","PNQ"],
  ["DEL","LKO"], ["DEL","GAU"], ["BOM","COK"], ["BLR","PNQ"], ["DEL","PAT"],
  ["HYD","CCU"], ["DEL","IXC"], ["BOM","JAI"], ["BLR","COK"], ["DEL","BBI"],
  ["BOM","LKO"], ["BLR","AMD"], ["MAA","CCU"], ["HYD","BLR"], ["DEL","ATQ"],
  ["BOM","PAT"], ["DEL","IXB"], ["BLR","GOI"], ["HYD","COK"], ["BOM","IXC"],
  ["MAA","COK"], ["DEL","VTZ"], ["BOM","BBI"], ["BLR","JAI"], ["HYD","PNQ"],
  ["DEL","TRV"], ["BOM","GAU"], ["BLR","LKO"], ["MAA","HYD"], ["CCU","GAU"],
  ["BOM","ATQ"], ["BLR","IXC"], ["HYD","JAI"], ["DEL","GOI"], ["BOM","IXB"],
  ["BLR","PAT"], ["MAA","PNQ"], ["CCU","PAT"], ["HYD","GOI"], ["BOM","TRV"],
  ["BLR","GAU"], ["DEL","AMD"], ["MAA","AMD"], ["CCU","IXB"], ["HYD","LKO"],
  ["BOM","VTZ"], ["BLR","BBI"], ["DEL","PNQ"], ["MAA","JAI"], ["CCU","BBI"],
  ["HYD","BBI"], ["BLR","ATQ"], ["DEL","BOM"], ["MAA","LKO"], ["CCU","LKO"],
  ["HYD","ATQ"], ["BLR","IXB"], ["BOM","GOI"], ["MAA","GAU"], ["CCU","IXC"]
];

export const DEFAULT_INDEX: Record<string, number> = {
  "T+1": 138.45,
  "T+7": 114.20,
  "T+15": 105.80,
  "T+30": 98.40,
  "T+45": 86.50
};

export const DEFAULT_ROUTE_SUMMARIES: RouteSummary[] = BASE_PAIRS.map(([orig, dest], i) => {
  const pshare = Math.max(0.005, (80 - i) / 3240);
  const avg_pct = (i % 2 === 0 ? 1 : -1) * ((i * 1.7) % 28.5) + (i < 10 ? 12 : 2);
  const route_index = 100 + avg_pct;
  const oCoord = AIRPORTS[orig] || [28.5562, 77.1000];
  const dCoord = AIRPORTS[dest] || [19.0896, 72.8656];
  return {
    route_id: `${orig}-${dest}`,
    avg_pct_change: Number(avg_pct.toFixed(2)),
    route_index: Number(route_index.toFixed(1)),
    passenger_share: Number(pshare.toFixed(4)),
    passenger_count: Math.round(pshare * 150000000),
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
  routes: DEFAULT_ROUTES_LIST.slice(0, 30),
  horizons: ["T+1", "T+7", "T+15", "T+30", "T+45"],
  z: DEFAULT_ROUTES_LIST.slice(0, 30).map((_, ri) => [
    35 + (ri % 15) * 2,
    14 + (ri % 10) * 1.5,
    5 + (ri % 8) * 1.2,
    -2 + (ri % 6) * 1.0,
    -12 - (ri % 5) * 1.1
  ]),
  text: DEFAULT_ROUTES_LIST.slice(0, 30).map((_, ri) => [
    `+${(35 + (ri % 15) * 2).toFixed(1)}%`,
    `+${(14 + (ri % 10) * 1.5).toFixed(1)}%`,
    `+${(5 + (ri % 8) * 1.2).toFixed(1)}%`,
    `${(-2 + (ri % 6) * 1.0).toFixed(1)}%`,
    `${(-12 - (ri % 5) * 1.1).toFixed(1)}%`
  ]),
  hover: DEFAULT_ROUTES_LIST.slice(0, 30).map((r, ri) => [
    `Route ${r} (T+1): +${(35 + (ri % 15) * 2).toFixed(1)}%`,
    `Route ${r} (T+7): +${(14 + (ri % 10) * 1.5).toFixed(1)}%`,
    `Route ${r} (T+15): +${(5 + (ri % 8) * 1.2).toFixed(1)}%`,
    `Route ${r} (T+30): ${(-2 + (ri % 6) * 1.0).toFixed(1)}%`,
    `Route ${r} (T+45): ${(-12 - (ri % 5) * 1.1).toFixed(1)}%`
  ]),
  weights: DEFAULT_ROUTES_LIST.slice(0, 30).map((_, i) => Number((Math.max(0.005, (30 - i) / 465)).toFixed(4)))
};

export const DEFAULT_MOSPI: MospiRow[] = [
  { date: "2024-01-01", cpi_index: 180.2, inflation_pct: 5.1 },
  { date: "2024-02-01", cpi_index: 181.0, inflation_pct: 5.0 },
  { date: "2024-03-01", cpi_index: 181.8, inflation_pct: 4.9 },
  { date: "2024-04-01", cpi_index: 182.5, inflation_pct: 4.8 },
  { date: "2024-05-01", cpi_index: 183.4, inflation_pct: 4.7 },
  { date: "2024-06-01", cpi_index: 184.2, inflation_pct: 5.1 },
  { date: "2024-07-01", cpi_index: 185.0, inflation_pct: 3.5 },
  { date: "2024-08-01", cpi_index: 185.8, inflation_pct: 3.7 },
  { date: "2024-09-01", cpi_index: 186.5, inflation_pct: 5.5 },
  { date: "2024-10-01", cpi_index: 187.3, inflation_pct: 6.2 },
  { date: "2024-11-01", cpi_index: 187.9, inflation_pct: 5.5 },
  { date: "2024-12-01", cpi_index: 188.6, inflation_pct: 5.2 }
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

