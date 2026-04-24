"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AD_ACCOUNTS, type AdAccount } from "@/lib/accounts";
import { translate } from "@/lib/locales";
import type { AppLocale, BillingCurrency } from "@/lib/locale-types";
import type { OverviewChannelKey } from "@/lib/overview-account-channels";

type DashboardSettingsContextValue = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  accountId: string;
  setAccountId: (id: string) => void;
  /** Conta resolvida (barra superior / faturamento e moeda dos KPIs globais). */
  account: AdAccount;
  /** Conta de anúncio escolhida por canal na Visão geral (pode diferir da conta global). */
  accountIdByOverviewChannel: Record<OverviewChannelKey, string>;
  setOverviewChannelAccountId: (channel: OverviewChannelKey, id: string) => void;
  /** Moeda de faturamento da conta selecionada (valores monetários seguem esta moeda). */
  billingCurrency: BillingCurrency;
  t: (key: string) => string;
  accountBillsInUsd: boolean;
  convertMoneyUsdToDisplay: (usd: number) => number;
  formatMoneyFromUsd: (usd: number, options?: { compact?: boolean; maximumFractionDigits?: number }) => string;
  formatDisplayCurrencyAmount: (amount: number, options?: { maximumFractionDigits?: number }) => string;
  formatCount: (n: number, options?: { compact?: boolean }) => string;
  formatRatio: (n: number) => string;
  intlLocale: string;
  displayCurrencyCode: BillingCurrency;
};

const DashboardSettingsContext = createContext<DashboardSettingsContextValue | null>(null);

const FALLBACK_RATE = Number(process.env.NEXT_PUBLIC_FALLBACK_USD_BRL ?? 5.5);

function initialOverviewChannelAccounts(): Record<OverviewChannelKey, string> {
  const first = AD_ACCOUNTS[0].id;
  return {
    meta: first,
    googleAds: first,
    gmb: first,
    instagram: first,
  };
}

export function DashboardSettingsProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>("pt-BR");
  const [accountId, setAccountId] = useState(AD_ACCOUNTS[0].id);
  const [accountIdByOverviewChannel, setAccountIdByOverviewChannel] =
    useState<Record<OverviewChannelKey, string>>(initialOverviewChannelAccounts);

  const setOverviewChannelAccountId = useCallback((channel: OverviewChannelKey, id: string) => {
    setAccountIdByOverviewChannel((prev) => ({ ...prev, [channel]: id }));
  }, []);

  const account = useMemo(() => AD_ACCOUNTS.find((a) => a.id === accountId) ?? AD_ACCOUNTS[0], [accountId]);
  const billingCurrency = account.billingCurrency;
  const accountBillsInUsd = billingCurrency === "USD";
  const displayCurrencyCode = billingCurrency;

  const intlLocale = locale === "pt-BR" ? "pt-BR" : "en-US";

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const rate = Number.isFinite(FALLBACK_RATE) ? FALLBACK_RATE : 5.5;

  const convertMoneyUsdToDisplay = useCallback(
    (usd: number) => {
      if (accountBillsInUsd) return usd;
      return usd * rate;
    },
    [accountBillsInUsd, rate],
  );

  const formatDisplayCurrencyAmount = useCallback(
    (amount: number, options?: { maximumFractionDigits?: number }) =>
      new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: displayCurrencyCode,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      }).format(amount),
    [displayCurrencyCode, intlLocale],
  );

  const formatMoneyFromUsd = useCallback(
    (usd: number, options?: { compact?: boolean; maximumFractionDigits?: number }) => {
      const maxFrac = options?.maximumFractionDigits ?? 2;
      const compact = options?.compact ?? false;

      if (accountBillsInUsd) {
        return new Intl.NumberFormat(intlLocale, {
          style: "currency",
          currency: "USD",
          notation: compact ? "compact" : "standard",
          maximumFractionDigits: compact ? 1 : maxFrac,
        }).format(usd);
      }

      const brl = usd * rate;
      return new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: "BRL",
        notation: compact ? "compact" : "standard",
        maximumFractionDigits: compact ? 1 : maxFrac,
      }).format(brl);
    },
    [accountBillsInUsd, intlLocale, rate],
  );

  const formatCount = useCallback(
    (n: number, options?: { compact?: boolean }) =>
      new Intl.NumberFormat(intlLocale, {
        notation: options?.compact ? "compact" : "standard",
        maximumFractionDigits: options?.compact ? 1 : 0,
      }).format(n),
    [intlLocale],
  );

  const formatRatio = useCallback(
    (n: number) =>
      `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(n)}x`,
    [intlLocale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      accountId,
      setAccountId,
      account,
      accountIdByOverviewChannel,
      setOverviewChannelAccountId,
      billingCurrency,
      t,
      accountBillsInUsd,
      convertMoneyUsdToDisplay,
      formatMoneyFromUsd,
      formatDisplayCurrencyAmount,
      formatCount,
      formatRatio,
      intlLocale,
      displayCurrencyCode,
    }),
    [
      locale,
      accountId,
      account,
      accountIdByOverviewChannel,
      setOverviewChannelAccountId,
      billingCurrency,
      t,
      accountBillsInUsd,
      convertMoneyUsdToDisplay,
      formatMoneyFromUsd,
      formatDisplayCurrencyAmount,
      formatCount,
      formatRatio,
      intlLocale,
      displayCurrencyCode,
    ],
  );

  return <DashboardSettingsContext.Provider value={value}>{children}</DashboardSettingsContext.Provider>;
}

export function useDashboardSettings() {
  const ctx = useContext(DashboardSettingsContext);
  if (!ctx) throw new Error("useDashboardSettings must be used within DashboardSettingsProvider");
  return ctx;
}
