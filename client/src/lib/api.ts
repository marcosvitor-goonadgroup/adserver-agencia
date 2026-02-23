const API_BASE = "/api";

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

export interface ReportSite {
  site_id: number;
  site_name: string;
  impressions: number;
  clicks: number;
  views: number;
  viewables: number;
  contracted?: number;
  delivered?: number;
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
