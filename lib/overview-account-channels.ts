/** Canais com conta de anúncio própria na Visão geral (mesmo cliente, contas distintas). */

export const OVERVIEW_CHANNEL_KEYS = ["meta", "googleAds", "gmb", "instagram"] as const;

export type OverviewChannelKey = (typeof OVERVIEW_CHANNEL_KEYS)[number];

/** Chaves de tradução para o nome do canal nos seletores. */
export const OVERVIEW_CHANNEL_LABEL_KEYS: Record<OverviewChannelKey, string> = {
  meta: "nav.meta",
  googleAds: "nav.googleAds",
  gmb: "nav.gmb",
  instagram: "nav.instagram",
};
