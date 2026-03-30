/**
 * Leitura das variáveis Meta no servidor (API routes, Server Actions, cron).
 * Não importar em componentes "use client".
 */
export type MetaServerEnv = {
  appId: string;
  appSecret: string;
  accessToken: string;
  /** ex.: act_1234567890 */
  adAccountId: string;
};

export function getMetaServerEnv(): MetaServerEnv {
  return {
    appId: process.env.META_APP_ID?.trim() ?? "",
    appSecret: process.env.META_APP_SECRET?.trim() ?? "",
    accessToken: process.env.META_USER_ACCESS_TOKEN?.trim() ?? "",
    adAccountId: process.env.META_AD_ACCOUNT_ID?.trim() ?? "",
  };
}

/** Token suficiente para listar contas e puxar insights (conta escolhida na UI). */
export function hasMetaAccessToken(): boolean {
  const e = getMetaServerEnv();
  return Boolean(e.accessToken);
}
