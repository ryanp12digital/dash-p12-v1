export const kpiData = [
  { label: "IMPRESSIONS", prev: "1.2M", prevRaw: "Prev. 1M", current: "1.42M", change: "+19%", positive: true },
  { label: "CLICKS", prev: "45.2K", prevRaw: "Prev. 42k", current: "48.9K", change: "+13.2%", positive: true },
  { label: "CONVERSIONS", prev: "842", prevRaw: "Prev. 790", current: "912", change: "+10.5%", positive: true },
  { label: "COST", prev: "$12.4K", prevRaw: "Prev. $11k", current: "$14.2K", change: "+15%", positive: false },
  { label: "CPA", prev: "$14.72", prevRaw: "Prev. $13.41", current: "$15.57", change: "+5.7%", positive: false },
  { label: "ROAS", prev: "4.2x", prevRaw: "Prev. 4.0x", current: "4.5x", change: "+17%", positive: true },
];

export const weeklyChartData = [
  { day: "Mon", cost: 1800, conversions: 95 },
  { day: "Tue", cost: 2200, conversions: 120 },
  { day: "Wed", cost: 1950, conversions: 108 },
  { day: "Thu", cost: 2600, conversions: 145 },
  { day: "Fri", cost: 2100, conversions: 130 },
  { day: "Sat", cost: 1600, conversions: 85 },
  { day: "Sun", cost: 1400, conversions: 70 },
];

export const campaigns = [
  {
    name: "Summer Promotion 2024",
    status: "ACTIVE",
    budget: "$500/day",
    cost: "$4,520",
    conversions: 284,
    cpa: "$15.91",
    roas: "6.2x",
    trend: "up",
    highlight: true,
  },
  {
    name: "Brand Awareness - Global",
    status: "ACTIVE",
    budget: "$200/day",
    cost: "$2,100",
    conversions: 42,
    cpa: "$50.00",
    roas: "1.8x",
    trend: "flat",
    highlight: false,
  },
  {
    name: "Product Launch Retargeting",
    status: "PAUSED",
    budget: "$100/day",
    cost: "$850",
    conversions: 115,
    cpa: "$7.39",
    roas: "11.4x",
    trend: "down",
    highlight: false,
  },
];

export const deviceData = [
  { label: "MOBILE", value: "$8,520", percent: 60, color: "#0729cf" },
  { label: "DESKTOP", value: "$4,260", percent: 30, color: "#0729cf" },
  { label: "TABLET", value: "$1,420", percent: 10, color: "#0729cf" },
];

export const placementData = [
  { label: "GOOGLE SEARCH", percent: 45, color: "#0729cf" },
  { label: "PMAX (CROSS-NETWORK)", percent: 35, color: "#3b82f6" },
  { label: "YOUTUBE ADS", percent: 20, color: "#60a5fa" },
];

export const multiMetricData = [
  { month: "JANUARY", cost: 8200, conversions: 420, cpa: 19.5, roas: 3.8 },
  { month: "FEBRUARY", cost: 9100, conversions: 510, cpa: 17.8, roas: 4.1 },
  { month: "MARCH", cost: 11500, conversions: 680, cpa: 16.9, roas: 4.4 },
  { month: "APRIL", cost: 13200, conversions: 820, cpa: 16.1, roas: 4.7 },
  { month: "MAY", cost: 12800, conversions: 890, cpa: 14.4, roas: 5.1 },
  { month: "JUNE", cost: 14200, conversions: 912, cpa: 15.6, roas: 4.5 },
];
