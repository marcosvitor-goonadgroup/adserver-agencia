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

// ── AdServer types ────────────────────────────────────────────────────────────

export interface Site {
  id: number;
  name: string;
  url: string;
  category: { id: number; name: string; iab: string } | null;
  status: { id: number; name: string };
  is_active: boolean;
  zones: Zone[];
  created_at: string;
}

export interface Zone {
  id: number;
  name: string;
  is_active: boolean;
  status: { id: number; name: string };
  format: { id: number; name: string };
}

export interface Dict {
  ad_formats: Record<string, string>;
  zone_formats: Record<string, string>;
  price_models: Record<string, string>;
  sizes: Record<string, string>;
  categories: Record<string, string>;
}

// ── AdServer API functions ────────────────────────────────────────────────────

export async function fetchSites(): Promise<Site[]> {
  const res = await fetch(`${API_BASE}/sites`);
  if (!res.ok) throw new Error(`Failed to fetch sites: ${res.status}`);
  return res.json();
}

export async function fetchDict(): Promise<Dict> {
  const res = await fetch(`${API_BASE}/dict`);
  if (!res.ok) throw new Error(`Failed to fetch dict: ${res.status}`);
  return res.json();
}

export async function createSite(body: {
  name: string;
  url: string;
  idcategory?: number;
}): Promise<Site> {
  const res = await fetch(`${API_BASE}/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function createZone(
  siteId: number,
  formatId: number,
  body: { name: string; idsize?: number; is_active: boolean }
): Promise<Zone> {
  const res = await fetch(`${API_BASE}/zones?idsite=${siteId}&idformat=${formatId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Error ${res.status}`);
  }
  return res.json();
}

export type ZoneTagType = "normal" | "iframe" | "amp" | "prebid" | "email";

export async function fetchZoneTag(zoneId: number, type: ZoneTagType = "normal"): Promise<string> {
  const res = await fetch(`${API_BASE}/zones/${zoneId}/tag?type=${type}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.text();
}

export async function createCampaign(body: {
  name: string;
  idadvertiser?: number;
  idpricemodel: number;
  rate?: number;
  start_date?: string;
  finish_date?: string;
}): Promise<Campaign> {
  const res = await fetch(`${API_BASE}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Error ${res.status}`);
  }
  return res.json();
}

export interface AdDetails {
  // Banner Image / ZIP
  idsize?: number;
  file?: string; // base64
  // Banner Video
  source_type?: "file" | "vast";
  vast_url?: string;
  // VAST Linear (in-stream video)
  skipoffset?: number;
  allow_skip?: boolean;
  // Banner HTML
  content_html?: string;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip data URL prefix (e.g. "data:image/png;base64,")
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function createAd(
  formatId: number,
  body: {
    idcampaign: number;
    name: string;
    url: string;
    is_active: boolean;
    details?: AdDetails;
    fileObj?: File; // convenience: will be converted to details.file (base64)
  }
): Promise<{ id: number; name: string }> {
  let details = body.details ?? {};
  if (body.fileObj) {
    details = { ...details, file: await fileToBase64(body.fileObj) };
  }

  const payload: Record<string, unknown> = {
    idcampaign: body.idcampaign,
    name: body.name,
    url: body.url,
    is_active: body.is_active,
    ...(Object.keys(details).length > 0 ? { details } : {}),
  };

  const res = await fetch(`${API_BASE}/ads?idformat=${formatId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detailErrors = (err as { details_errors?: Record<string, string[]> }).details_errors;
    if (detailErrors) {
      const msgs = Object.values(detailErrors).flat().join(" ");
      throw new Error(msgs);
    }
    throw new Error((err as { message?: string }).message ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function assignAdToZones(
  adId: number,
  zones: number[]
): Promise<void> {
  const res = await fetch(`${API_BASE}/ads/assign?id=${adId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zones }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Error ${res.status}`);
  }
}

// ── Campaign API functions ────────────────────────────────────────────────────

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
