export interface RateData {
  date: string;
  rates: {
    EUR: number;
    GBP: number;
    JPY: number;
    USD: number;
  };
  timestamp: number;
}

export interface ChartData {
  date: string;
  EUR: number;
  GBP: number;
  JPY: number;
  USD: number;
}
