"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { IconInstagram } from "@/components/platform-icons";
import DashboardDateCompareToolbar from "@/components/DashboardDateCompareToolbar";
import DashboardPeriodLegend from "@/components/DashboardPeriodLegend";
import PageWidgetLayout from "@/components/dashboard/PageWidgetLayout";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";
import { useOverviewScope } from "@/components/OverviewScopeContext";
import { DASHBOARD_PAGE_MAIN_CLASS } from "@/lib/dashboard-layout";
import {
  type InstagramConnectedAccount,
  type InstagramFeedItem,
  fetchInstagramConnectedAccounts,
  fetchInstagramFeed,
  fetchInstagramStories,
  fetchInstagramSummary,
  fetchMediaInsightsFull,
  INSTAGRAM_SELECTED_IG_KEY,
} from "@/lib/instagram-api";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function mediaType(m: Record<string, unknown>): string {
  return String(m.media_type || "").toUpperCase();
}

function isCarousel(m: Record<string, unknown>) {
  return mediaType(m) === "CAROUSEL_ALBUM";
}

function isReel(m: Record<string, unknown>) {
  return mediaType(m) === "VIDEO" || mediaType(m) === "REEL";
}

function StoryStrip({ items, onOpen }: { items: InstagramFeedItem[]; onOpen: (it: InstagramFeedItem, isStory: boolean) => void }) {
  const { t } = useDashboardSettings();
  if (items.length === 0) {
    return (
      <div className="dashboard-card border border-(--border) p-5 text-sm text-(--text-muted)">
        {t("insta.storiesEmpty")}
      </div>
    );
  }
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 pt-0.5 dashboard-scroll">
      {items.map((it, i) => {
        const m = it.media;
        const id = String(m.id || i);
        const src = (m.thumbnail_url || m.media_url) as string | undefined;
        return (
          <button
            type="button"
            key={id}
            onClick={() => onOpen(it, true)}
            className="group relative h-40 w-28 shrink-0 overflow-hidden rounded-2xl border border-(--border) bg-(--surface) text-left shadow-(--shadow-card) transition-[border-color] hover:border-(--border-accent)"
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-(--surface-elevated) text-[10px] text-(--text-muted)">Story</div>
            )}
            <span className="absolute bottom-2 left-2 rounded-md bg-[rgba(7,9,16,0.72)] px-1.5 py-0.5 text-[10px] text-(--text-primary)">
              {t("insta.stories")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PostCard({
  item,
  onOpen,
  variant,
}: {
  item: InstagramFeedItem;
  onOpen: (it: InstagramFeedItem, isStory: boolean) => void;
  variant: "carousel" | "post" | "reel";
}) {
  const { t } = useDashboardSettings();
  const m = item.media;
  const src = (m.thumbnail_url || m.media_url) as string | undefined;
  const cap = (m.caption as string | undefined) || "—";
  return (
    <div className="dashboard-card flex min-w-0 flex-col overflow-hidden border border-(--border)">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-(--surface-elevated)">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-(--text-muted)">IG</div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-[rgba(7,9,16,0.65)] px-1.5 py-0.5 text-[10px] font-semibold text-(--text-primary)">
          {variant === "carousel" ? t("insta.carousels") : variant === "reel" ? t("insta.reels") : t("insta.posts")}
        </span>
      </div>
      <div className="space-y-2 p-3">
        <p className="line-clamp-2 min-h-9 text-xs text-(--text-secondary)">{cap}</p>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {(item.metrics3 || []).map((x, j) => (
            <div key={j} className="rounded-lg border border-(--border) bg-(--surface-elevated) px-1.5 py-1.5">
              <p className="text-[9px] font-medium uppercase tracking-wider text-(--text-muted)">{x.label}</p>
              <p className="font-data text-sm text-(--text-primary)">{x.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpen(item, false)}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-(--border) bg-(--surface-elevated) px-2 py-1.5 text-xs font-semibold text-(--accent) transition hover:border-(--border-accent)"
          >
            {t("insta.viewMetrics")}
          </button>
          {m.permalink ? (
            <a
              href={String(m.permalink)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--border) text-(--text-muted) hover:text-(--text-primary)"
              title={t("insta.openPost")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InsightsModal({
  open,
  onClose,
  mediaId,
  isStory,
}: {
  open: boolean;
  onClose: () => void;
  mediaId: string | null;
  isStory: boolean;
}) {
  const { t } = useDashboardSettings();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, string | number | null> | null>(null);

  const load = useCallback(async () => {
    if (!mediaId) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetchMediaInsightsFull(mediaId, isStory);
      setData(r.normalized);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "erro");
    } finally {
      setLoading(false);
    }
  }, [mediaId, isStory]);

  useEffect(() => {
    if (open && mediaId) void load();
  }, [open, mediaId, load]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.6)]" onClick={onClose} aria-label="Fechar" />
      <div className="relative z-10 max-h-[min(80vh,680px)] w-full max-w-lg overflow-hidden rounded-2xl border border-(--border) bg-(--surface-strong) shadow-2xl">
        <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
          <p className="text-sm font-semibold text-(--text-primary)">{t("insta.metricsTitle")}</p>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-(--text-muted) hover:bg-(--surface) hover:text-(--text-primary)">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 dashboard-scroll">
          {loading && <p className="text-sm text-(--text-muted)">…</p>}
          {err && <p className="text-sm text-rose-300">{err}</p>}
          {data && !loading && (
            <dl className="space-y-2 text-sm">
              {Object.entries(data).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-(--border) border-dashed py-1.5">
                  <dt className="text-(--text-muted)">{k}</dt>
                  <dd className="font-data text-(--text-primary)">{v === null || v === undefined ? "—" : String(v)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function extractSeriesFromUserInsights(raw: unknown): { data: { t: string; v: number }[]; label: string } | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as { data?: unknown[] };
  const rows = o.data;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const first = rows[0] as { name?: string; values?: { value?: number; end_time?: string }[] };
  const name = first.name || "value";
  const values = first.values;
  if (!Array.isArray(values) || values.length === 0) return null;
  const pts: { t: string; v: number }[] = values.slice(-30).map((p, i) => ({
    t: String(p.end_time || i),
    v: Number(p.value) || 0,
  }));
  if (pts.length < 2) return null;
  return { data: pts, label: name };
}

export default function InstagramDashboard() {
  const { t, intlLocale } = useDashboardSettings();
  const { dateFrom, dateTo } = useOverviewScope();
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof fetchInstagramSummary>> | null>(null);
  const [stories, setStories] = useState<InstagramFeedItem[]>([]);
  const [feed, setFeed] = useState<InstagramFeedItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalId, setModalId] = useState<string | null>(null);
  const [modalStory, setModalStory] = useState(false);
  const [igAccounts, setIgAccounts] = useState<InstagramConnectedAccount[]>([]);
  const [activeIgId, setActiveIgId] = useState<string | undefined>(undefined);
  const [igInit, setIgInit] = useState(false);

  const canFetch = getApiBaseUrl() !== "";

  useEffect(() => {
    if (!canFetch) {
      setIgInit(true);
      return;
    }
    (async () => {
      try {
        const r = await fetchInstagramConnectedAccounts();
        setIgAccounts(r.accounts);
        if (r.accounts.length > 0) {
          const ids = r.accounts.map((a) => a.igUserId);
          const saved = typeof localStorage !== "undefined" ? localStorage.getItem(INSTAGRAM_SELECTED_IG_KEY) : null;
          let next: string;
          if (saved && ids.includes(saved)) next = saved;
          else if (r.defaultFromEnv && ids.includes(r.defaultFromEnv)) next = r.defaultFromEnv;
          else next = r.accounts[0].igUserId;
          setActiveIgId(next);
          try {
            localStorage.setItem(INSTAGRAM_SELECTED_IG_KEY, next);
          } catch {
            /* */
          }
        } else {
          // Sem Páginas no token: backend usa só INSTAGRAM_BUSINESS_ACCOUNT_ID do .env
          setActiveIgId(r.defaultFromEnv || undefined);
        }
      } catch {
        setIgAccounts([]);
        setActiveIgId(undefined);
      } finally {
        setIgInit(true);
      }
    })();
  }, [canFetch]);

  const load = useCallback(async () => {
    if (!canFetch) {
      setLoadError("no_api");
      return;
    }
    if (!igInit) return;
    setLoadError(null);
    try {
      const ig = activeIgId?.trim() || undefined;
      const [s, st, fd] = await Promise.all([
        fetchInstagramSummary(dateFrom, dateTo, ig),
        fetchInstagramStories(dateFrom, dateTo, ig),
        fetchInstagramFeed(dateFrom, dateTo, ig),
      ]);
      setSummary(s);
      setStories(st.items || []);
      setFeed(fd.items || []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "erro");
      setSummary(null);
      setStories([]);
      setFeed([]);
    }
  }, [dateFrom, dateTo, canFetch, igInit, activeIgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSelectIg = (igUserId: string) => {
    setActiveIgId(igUserId);
    try {
      localStorage.setItem(INSTAGRAM_SELECTED_IG_KEY, igUserId);
    } catch {
      /* */
    }
  };

  const { carousels, posts, reels } = useMemo(() => {
    const c: InstagramFeedItem[] = [];
    const p: InstagramFeedItem[] = [];
    const r: InstagramFeedItem[] = [];
    for (const it of feed) {
      const m = it.media;
      if (isCarousel(m)) c.push(it);
      else if (isReel(m)) r.push(it);
      else p.push(it);
    }
    return { carousels: c, posts: p, reels: r };
  }, [feed]);

  const chartSeries = useMemo(() => extractSeriesFromUserInsights(summary?.userInsights), [summary]);

  const onOpen = (it: InstagramFeedItem, isStory: boolean) => {
    const id = it.media["id"] != null ? String(it.media["id"]) : null;
    setModalId(id);
    setModalStory(isStory);
    setModalOpen(true);
  };

  const summaryBlock = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="dashboard-card border border-(--border) p-4 sm:col-span-1 sm:row-span-1">
        <p className="dashboard-kicker text-[9px]">{t("insta.followers")}</p>
        <p className="mt-1 font-data text-2xl font-light text-(--text-primary)">
          {summary?.followers != null ? new Intl.NumberFormat(intlLocale).format(summary.followers) : "—"}
        </p>
        {summary?.username && <p className="mt-1 text-xs text-(--text-secondary)">@{summary.username}</p>}
      </div>
      {summary?.profilePicture && (
        <div className="hidden sm:block sm:col-span-1">
          <div className="dashboard-card flex h-full min-h-[96px] items-center justify-center overflow-hidden border border-(--border) p-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={String(summary.profilePicture)} alt="" className="max-h-28 w-auto object-contain opacity-95" />
          </div>
        </div>
      )}
    </div>
  );

  const storiesBlock = <StoryStrip items={stories} onOpen={onOpen} />;

  const chartsBlock =
    chartSeries && chartSeries.data.length > 1 ? (
      <div className="dashboard-card border border-(--border) p-4">
        <p className="text-sm font-medium text-(--text-primary)">{t("insta.chartImpressions")}</p>
        <div className="mt-2 h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartSeries.data} margin={{ left: -8, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="rgba(45,65,120,0.12)" strokeDasharray="4 4" />
              <XAxis dataKey="t" tick={{ fill: "var(--text-muted)", fontSize: 9 }} tickFormatter={(v) => (v && v.length > 10 ? v.slice(0, 10) : v)} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-strong)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                }}
                labelStyle={{ color: "var(--text-secondary)" }}
              />
              <Area type="monotone" dataKey="v" name={chartSeries.label} stroke="var(--accent)" fill="var(--accent-soft)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    ) : (
      <div className="dashboard-card border border-dashed border-(--border) p-4 text-sm text-(--text-muted)">
        {t("insta.chartImpressions")} — {t("placeholder.instaBody")}
      </div>
    );

  const carouselsBlock = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {carousels.length === 0 ? (
        <p className="text-sm text-(--text-muted)">—</p>
      ) : (
        carousels.map((it) => {
          const id = String(it.media["id"] ?? Math.random());
          return <PostCard key={id} item={it} onOpen={onOpen} variant="carousel" />;
        })
      )}
    </div>
  );

  const postsBlock = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[...reels, ...posts].length === 0 ? (
        <p className="text-sm text-(--text-muted)">—</p>
      ) : (
        <>
          {reels.map((it) => {
            const id = String(it.media["id"] ?? Math.random());
            return <PostCard key={`r-${id}`} item={it} onOpen={onOpen} variant="reel" />;
          })}
          {posts.map((it) => {
            const id = String(it.media["id"] ?? Math.random());
            return <PostCard key={`p-${id}`} item={it} onOpen={onOpen} variant="post" />;
          })}
        </>
      )}
    </div>
  );

  return (
    <main className={DASHBOARD_PAGE_MAIN_CLASS}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--accent-soft)">
            <IconInstagram className="h-5 w-5 text-(--accent)" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-(--accent) uppercase opacity-80">{t("placeholder.kicker.insta")}</p>
            <h1 className="text-2xl font-bold tracking-tight text-(--text-primary)">Instagram</h1>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <DashboardDateCompareToolbar />
          <DashboardPeriodLegend />
        </div>
      </div>

      {igInit && (igAccounts.length > 0 || activeIgId) && (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-[11px] text-(--text-muted) sm:max-w-md">{t("insta.selectAccountHint")}</p>
          {igAccounts.length > 0 ? (
            <label className="flex w-full min-w-0 flex-col gap-1 sm:max-w-md">
              <span className="text-[10px] font-medium uppercase tracking-wider text-(--text-muted)">
                {t("insta.selectAccount")}
              </span>
              <select
                value={activeIgId && igAccounts.some((a) => a.igUserId === activeIgId) ? activeIgId : igAccounts[0]?.igUserId}
                onChange={(e) => onSelectIg(e.target.value)}
                className="w-full rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5 text-sm text-(--text-primary) focus:border-(--border-accent) focus:outline-none"
              >
                {igAccounts.map((a) => (
                  <option key={a.igUserId} value={a.igUserId}>
                    @{a.username || a.igUserId} · {t("insta.pageLabel")}: {a.pageName || a.pageId}
                  </option>
                ))}
              </select>
            </label>
          ) : activeIgId ? (
            <p className="text-xs text-(--text-secondary)">
              IG ID: <span className="font-data text-(--text-primary)">{activeIgId}</span> (via .env)
            </p>
          ) : null}
        </div>
      )}

      {loadError === "no_api" && (
        <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          {t("insta.missingApiUrl")}
        </div>
      )}
      {loadError && loadError !== "no_api" && (
        <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          {t("insta.loadError")} ({loadError})
        </div>
      )}

      <PageWidgetLayout
        layoutId="instagram"
        blocks={[
          { id: "kpi", labelKey: "pageBlock.insta.kpis", content: summaryBlock },
          { id: "stories", labelKey: "pageBlock.insta.stories", content: storiesBlock },
          { id: "charts", labelKey: "pageBlock.insta.charts", content: chartsBlock },
          { id: "carousels", labelKey: "pageBlock.insta.carousels", content: carouselsBlock },
          { id: "posts", labelKey: "pageBlock.insta.posts", content: postsBlock },
        ]}
      />

      <footer className="py-4 text-center text-xs text-(--text-muted)">{t("overview.footer")}</footer>

      <InsightsModal open={modalOpen} onClose={() => setModalOpen(false)} mediaId={modalId} isStory={modalStory} />
    </main>
  );
}
