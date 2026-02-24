const API_BASE = "https://adserver-api.vercel.app";

export interface Campaign {
  id: number;
  name: string;
  advertiser: { id: number; name: string; email: string };
  status: { id: number; name: string };
  runstatus: { id: number; name: string };
  pricemodel: { id: number; name: string };
  counters: {
    impressions: number | string;
    clicks: number | string;
    total_balance: number;
    today_date: string | null;
    daily_impressions: number | string;
    daily_clicks: number | string;
    daily_balance: number;
  };
  limits: {
    start_at: string | null;
    finish_at: string | null;
    budget: { total: number; daily: number } | null;
    additional: { type: number; limit_total: number; limit_daily: number } | null;
  };
  ads: { id: number; name: string }[];
  created_at: string;
  updated_at: string;
}

export interface DayStats {
  requests: number;
  impressions: number;
  impressions_unique: number;
  views: number;
  clicks: number;
  clicks_unique: number;
  conversions: number;
  amount: number;
}

export interface ReportAd {
  ad_id: number;
  ad_name: string;
  stats: DayStats;
  video: unknown;
}

export interface ReportZone {
  zone_id: number;
  zone_name: string | null;
  stats: DayStats | null;
  ads: ReportAd[];
}

export interface ReportDay {
  date: string;
  stats: DayStats | null;
  zones: ReportZone[];
}

export interface ReportSite {
  site_id: number;
  site_name: string;
  days: ReportDay[];
}

export interface CampaignReport {
  campaign_id: number;
  dateBegin: string;
  dateEnd: string;
  sites: ReportSite[];
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${API_BASE}/campaigns`);
  if (!res.ok) throw new Error(`Failed to fetch campaigns: ${res.status}`);
  return res.json();
}

export async function fetchCampaignReport(
  id: number,
  dateBegin: string,
  dateEnd: string
): Promise<CampaignReport> {
  const res = await fetch(
    `${API_BASE}/campaigns/${id}/report?dateBegin=${dateBegin}&dateEnd=${dateEnd}`
  );
  if (!res.ok) throw new Error(`Failed to fetch report: ${res.status}`);
  return res.json();
}
