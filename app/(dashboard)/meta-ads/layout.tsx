import type { ReactNode } from "react";
import { MetaAdsDataProvider } from "@/components/meta/MetaAdsDataContext";

export default function MetaAdsLayout({ children }: { children: ReactNode }) {
  return <MetaAdsDataProvider>{children}</MetaAdsDataProvider>;
}
