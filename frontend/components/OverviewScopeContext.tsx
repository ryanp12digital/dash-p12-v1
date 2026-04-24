"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CampaignRow, CampaignChannelKey } from "@/lib/data";
import { defaultLastNDaysRange } from "@/lib/overview-dates";

const ALL_CHANNELS: CampaignChannelKey[] = ["pmax", "youtube", "search"];

export type OverviewScopeValue = {
  dateFrom: string;
  dateTo: string;
  setDateRange: (from: string, to: string) => void;
  compareWithPrevious: boolean;
  setCompareWithPrevious: (v: boolean) => void;
  selectedChannels: CampaignChannelKey[];
  toggleChannel: (c: CampaignChannelKey) => void;
  selectAllChannels: () => void;
  includeActive: boolean;
  includePaused: boolean;
  setIncludeActive: (v: boolean) => void;
  setIncludePaused: (v: boolean) => void;
  filterCampaigns: (rows: CampaignRow[]) => CampaignRow[];
};

const OverviewScopeContext = createContext<OverviewScopeValue | null>(null);

export function OverviewScopeProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => defaultLastNDaysRange(30), []);
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<CampaignChannelKey[]>([...ALL_CHANNELS]);
  const [includeActive, setIncludeActive] = useState(true);
  const [includePaused, setIncludePaused] = useState(true);

  const setDateRange = useCallback((from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  }, []);

  const toggleChannel = useCallback((c: CampaignChannelKey) => {
    setSelectedChannels((prev) => {
      if (prev.includes(c)) {
        const next = prev.filter((x) => x !== c);
        return next.length === 0 ? [...ALL_CHANNELS] : next;
      }
      return [...prev, c].sort((a, b) => ALL_CHANNELS.indexOf(a) - ALL_CHANNELS.indexOf(b));
    });
  }, []);

  const selectAllChannels = useCallback(() => {
    setSelectedChannels([...ALL_CHANNELS]);
  }, []);

  const filterCampaigns = useCallback(
    (rows: CampaignRow[]) =>
      rows.filter((row) => {
        const channelOk =
          selectedChannels.length === ALL_CHANNELS.length || selectedChannels.includes(row.channelKey);
        const activeOk = row.statusKey === "status.active" ? includeActive : includePaused;
        return channelOk && activeOk;
      }),
    [selectedChannels, includeActive, includePaused],
  );

  const value = useMemo(
    () => ({
      dateFrom,
      dateTo,
      setDateRange,
      compareWithPrevious,
      setCompareWithPrevious,
      selectedChannels,
      toggleChannel,
      selectAllChannels,
      includeActive,
      includePaused,
      setIncludeActive,
      setIncludePaused,
      filterCampaigns,
    }),
    [
      dateFrom,
      dateTo,
      setDateRange,
      compareWithPrevious,
      selectedChannels,
      toggleChannel,
      selectAllChannels,
      includeActive,
      includePaused,
      filterCampaigns,
    ],
  );

  return <OverviewScopeContext.Provider value={value}>{children}</OverviewScopeContext.Provider>;
}

export function useOverviewScope() {
  const ctx = useContext(OverviewScopeContext);
  if (!ctx) throw new Error("useOverviewScope must be used within OverviewScopeProvider");
  return ctx;
}

export const overviewChannelKeys = ALL_CHANNELS;
