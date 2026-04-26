"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import {
  IconMeta,
  IconGoogleAds,
  IconGoogleBusiness,
  IconInstagram,
} from "@/components/platform-icons";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";

const NAV = [
  { href: "/",                   labelKey: "nav.overview",  Icon: LayoutDashboard },
  { href: "/meta-ads",           labelKey: "nav.meta",      Icon: IconMeta        },
  { href: "/google-ads",         labelKey: "nav.googleAds", Icon: IconGoogleAds   },
  { href: "/google-meu-negocio", labelKey: "nav.gmb",       Icon: IconGoogleBusiness },
  { href: "/instagram",          labelKey: "nav.instagram", Icon: IconInstagram   },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useDashboardSettings();

  return (
    <aside
      className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center gap-1 border-t border-(--border) bg-(--surface) px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-md md:z-auto md:h-screen md:w-[72px] md:flex-col md:items-center md:gap-2 md:border-r md:border-t-0 md:px-0 md:py-4 md:pb-4 md:sticky md:top-0"
    >
      <Link
        href="/"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:hidden"
        style={{
          background: "linear-gradient(135deg, #3573E6 0%, #1a4cf5 100%)",
          boxShadow: "0 4px 14px rgba(53,115,230,0.35)",
        }}
        title={t("nav.homeTitle")}
      >
        <span className="text-[10px] font-bold text-white">P12</span>
      </Link>

      <Link
        href="/"
        className="mb-4 hidden flex-col items-center gap-1.5 px-2 md:flex"
        title={t("nav.homeTitle")}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, #3573E6 0%, #1a4cf5 100%)",
            boxShadow: "0 4px 14px rgba(53,115,230,0.35)",
          }}
        >
          <span className="text-xs font-bold text-white">P12</span>
        </div>
        <span className="max-w-[64px] text-center text-[9px] leading-tight font-bold text-(--text-muted)">
          P12 Digital
        </span>
      </Link>

      <nav
        className="flex flex-1 flex-row items-center justify-around md:flex-col md:justify-start md:gap-1 md:px-0"
        aria-label={t("nav.main")}
      >
        {NAV.map(({ href, labelKey, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          const label = t(labelKey);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors md:h-11 md:w-11 ${
                active
                  ? "bg-(--accent-soft) text-(--accent)"
                  : "text-(--text-secondary) hover:bg-(--accent-soft) hover:text-(--accent)"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
