import type { BillingCurrency } from "@/lib/locale-types";

export type AdAccount = {
  id: string;
  labelKey: string;
  billingCurrency: BillingCurrency;
};

export const AD_ACCOUNTS: AdAccount[] = [
  /** Faturamento em BRL (ex.: contas Meta/Google no Brasil). */
  { id: "acc-1", labelKey: "account.main", billingCurrency: "BRL" },
  { id: "acc-2", labelKey: "account.alpha", billingCurrency: "BRL" },
  /** Faturamento em USD (ex.: conta internacional Meta/Google) — valores em dólar, sem conversão. */
  { id: "acc-3", labelKey: "account.beta", billingCurrency: "USD" },
];
