import { getApiBaseUrl } from "@/lib/api-base";

export const INSTAGRAM_SELECTED_IG_KEY = "p12-instagram-selected-ig-id";

export type InstagramMetric3 = { label: string; value: string };

export type InstagramFeedItem = {
  media: Record<string, unknown>;
  insights: Record<string, string | number | null | undefined>;
  metrics3: InstagramMetric3[];
  rawInsights?: unknown;
};

export type InstagramSummary = {
  igUserId: string;
  username?: string;
  followers?: number;
  mediaCount?: number;
  profilePicture?: string;
  userInsights: unknown;
};

export type InstagramConnectedAccount = {
  pageId: string;
  pageName: string;
  igUserId: string;
  username: string;
  profilePictureUrl?: string;
};

function q(igId: string | undefined): string {
  if (!igId?.trim()) return "";
  return `&ig_id=${encodeURIComponent(igId.trim())}`;
}

async function j<T>(path: string): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error("missing_api_url");
  }
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || res.statusText);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("invalid_json");
  }
}

export function fetchInstagramConnectedAccounts() {
  return j<{ accounts: InstagramConnectedAccount[]; defaultFromEnv: string | null }>("/instagram/connected-accounts");
}

export function fetchInstagramSummary(since: string, until: string, igId?: string) {
  return j<InstagramSummary>(
    `/instagram/summary?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}${q(igId)}`,
  );
}

export function fetchInstagramStories(since: string, until: string, igId?: string) {
  return j<{ items: InstagramFeedItem[]; count: number; igUserId: string }>(
    `/instagram/stories?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&limit=40${q(igId)}`,
  );
}

export function fetchInstagramFeed(since: string, until: string, igId?: string) {
  return j<{ items: InstagramFeedItem[]; count: number; igUserId: string }>(
    `/instagram/feed?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&limit=48${q(igId)}`,
  );
}

export function fetchMediaInsightsFull(mediaId: string, isStory: boolean) {
  return j<{ mediaId: string; normalized: Record<string, string | number | null>; raw: unknown }>(
    `/instagram/media/${encodeURIComponent(mediaId)}/insights?is_story=${isStory ? "true" : "false"}`,
  );
}
