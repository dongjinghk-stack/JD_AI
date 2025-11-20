export const REPORTING_YEAR_START = "2024-12";
export const REPORTING_YEAR_END = "2025-11";

// MPF Constraints (Simplified for MVP)
export const MPF_MONTHLY_CAP_INCOME = 30000;
export const MPF_MONTHLY_MIN_INCOME = 7100;
export const MPF_MAX_CONTRIBUTION = 1500;

// Catering Industry Scheme Daily Bands (Simplified Mock)
export const INDUSTRY_SCHEME_BANDS = [
  { min: 0, max: 279, er: 10, ee: 0 }, // Simplified fixed simplified assumption for MVP, usually % or fixed
  { min: 280, max: 349, er: 10, ee: 10 },
  { min: 350, max: 649, er: 20, ee: 20 },
  { min: 650, max: 99999, er: '5%', ee: '5%', cap: 50 } // Mixed logic
];
