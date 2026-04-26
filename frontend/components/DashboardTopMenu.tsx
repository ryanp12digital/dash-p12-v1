"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { IconMeta, IconGoogleAds, IconGoogleBusiness, IconInstagram } from "@/components/platform-icons";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";

const NAV = [
  { href: "/",                   labelKey: "nav.overview",  Icon: LayoutDashboard },
  { href: "/meta-ads",           labelKey: "nav.meta",      Icon: IconMeta        },
  { href: "/google-ads",         labelKey: "nav.googleAds", Icon: IconGoogleAds   },
  { href: "/google-meu-negocio", labelKey: "nav.gmb",       Icon: IconGoogleBusiness },
  { href: "/instagram",          labelKey: "nav.instagram", Icon: IconInstagram   },
] as const;

export default function DashboardTopMenu() {
  const pathname = usePathname();
  const { t } = useDashboardSettings();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
      }}
    >
      <nav
        aria-label={t("nav.main")}
        className="flex items-center gap-1 rounded-2xl border border-(--border) bg-[color-mix(in_oklab,var(--surface-strong)_88%,transparent)] px-2 py-2 shadow-[var(--shadow-menu)] backdrop-blur-md"
      >
        {NAV.map(({ href, labelKey, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          const label = t(labelKey);

          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                active
                  ? "bg-(--accent-soft) text-(--accent) shadow-sm"
                  : "text-(--text-secondary) hover:bg-(--accent-soft) hover:text-(--text-primary)"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                  active ? "text-(--accent)" : "text-(--text-secondary)"
                }`}
                aria-hidden
              />
              <span className="whitespace-nowrap">{label}</span>

              {active && (
                <span
                  className="absolute -bottom-[13px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-(--accent)"
                  aria-hidden
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
