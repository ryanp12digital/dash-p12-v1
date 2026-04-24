"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useOverviewScope } from "@/components/OverviewScopeContext";
import { metaKpiRows, type MetaKpiRow } from "@/lib/meta-ads-data";

const STORAGE_KEY = "p12-meta-ad-account-id";

export type MetaAdAccountOption = {
  id: string;
  name: string;
  currency: string | null;
  accountId: string;
};

type MetaAdsDataContextValue = {
  accounts: MetaAdAccountOption[];
  accountsLoading: boolean;
  accountsError: string | null;
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string) => void;
  kpiRows: MetaKpiRow[];
  insightsLoading: boolean;
  insightsError: string | null;
  hasTokenConfigured: boolean | null;
};

const MetaAdsDataContext = createContext<MetaAdsDataContextValue | null>(null);

export function MetaAdsDataProvider({ children }: { children: ReactNode }) {
  const { dateFrom, dateTo, compareWithPrevious } = useOverviewScope();
  const [accounts, setAccounts] = useState<MetaAdAccountOption[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountIdState] = useState<string | null>(null);
  const [kpiRows, setKpiRows] = useState<MetaKpiRow[]>(() => metaKpiRows.map((r) => ({ ...r })));
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [hasTokenConfigured, setHasTokenConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAccountsLoading(true);
      setAccountsError(null);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/ad-accounts`);
        const data = (await res.json()) as { accounts?: MetaAdAccountOption[]; error?: string; code?: string };
        if (!res.ok) {
          if (res.status === 501) {
            setHasTokenConfigured(false);
            setAccounts([]);
            setAccountsError(data.error ?? "Token não configurado");
            return;
          }
          throw new Error(data.error ?? res.statusText);
        }
        if (cancelled) return;
        setHasTokenConfigured(true);
        setAccounts(data.accounts ?? []);
        const list = data.accounts ?? [];
        if (list.length === 0) {
          setSelectedAccountIdState(null);
          return;
        }
        const stored =
          typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
        const pick = stored && list.some((a) => a.id === stored) ? stored : list[0].id;
        setSelectedAccountIdState(pick);
        if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, pick);
      } catch (e) {
        if (!cancelled) {
          setAccountsError(e instanceof Error ? e.message : "Erro ao carregar contas");
          setAccounts([]);
        }
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setSelectedAccountId = useCallback((id: string) => {
    setSelectedAccountIdState(id);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  useEffect(() => {
    if (!selectedAccountId || hasTokenConfigured === false) return;
    let cancelled = false;
    (async () => {
      setInsightsLoading(true);
      setInsightsError(null);
      try {
        const params = new URLSearchParams({
          accountId: selectedAccountId,
          since: dateFrom,
          until: dateTo,
          compare: compareWithPrevious ? "1" : "0",
        });
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/insights?${params.toString()}`);
        const data = (await res.json()) as { kpiRows?: MetaKpiRow[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? res.statusText);
        if (cancelled) return;
        if (data.kpiRows?.length) {
          setKpiRows(data.kpiRows);
        }
      } catch (e) {
        if (!cancelled) {
          setInsightsError(e instanceof Error ? e.message : "Erro ao carregar insights");
          setKpiRows(metaKpiRows.map((r) => ({ ...r })));
        }
      } finally {
        if (!cancelled) setInsightsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedAccountId, hasTokenConfigured, dateFrom, dateTo, compareWithPrevious]);

  const value = useMemo(
    () => ({
      accounts,
      accountsLoading,
      accountsError,
      selectedAccountId,
      setSelectedAccountId,
      kpiRows,
      insightsLoading,
      insightsError,
      hasTokenConfigured,
    }),
    [
      accounts,
      accountsLoading,
      accountsError,
      selectedAccountId,
      setSelectedAccountId,
      kpiRows,
      insightsLoading,
      insightsError,
      hasTokenConfigured,
    ],
  );

  return <MetaAdsDataContext.Provider value={value}>{children}</MetaAdsDataContext.Provider>;
}

export function useMetaAdsData() {
  const ctx = useContext(MetaAdsDataContext);
  if (!ctx) throw new Error("useMetaAdsData must be used within MetaAdsDataProvider");
  return ctx;
}
