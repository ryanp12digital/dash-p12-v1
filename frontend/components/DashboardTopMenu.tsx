"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { IconMeta, IconGoogleAds, IconGoogleBusiness, IconInstagram } from "@/components/platform-icons";
import { useDashboardSettings } from "@/components/DashboardSettingsProvider";

const NAV = [
  { href: "/",                  labelKey: "nav.overview",  Icon: LayoutDashboard, iconColor: "text-blue-500"   },
  { href: "/meta-ads",          labelKey: "nav.meta",      Icon: IconMeta,        iconColor: "text-[#0668E1]"  },
  { href: "/google-ads",        labelKey: "nav.googleAds", Icon: IconGoogleAds,   iconColor: "text-[#4285F4]"  },
  { href: "/google-meu-negocio",labelKey: "nav.gmb",       Icon: IconGoogleBusiness, iconColor: "text-[#16a34a]" },
  { href: "/instagram",         labelKey: "nav.instagram", Icon: IconInstagram,   iconColor: "text-[#E4405F]"  },
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
        className="flex items-center gap-1 rounded-2xl border border-[rgba(100,95,120,0.35)] bg-[rgba(10,9,19,0.88)] px-2 py-2 shadow-[0_16px_44px_rgba(0,0,0,0.52),0_2px_18px_rgba(232,160,32,0.08)] backdrop-blur-md"
      >
        {NAV.map(({ href, labelKey, Icon, iconColor }) => {
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
                  ? "bg-[rgba(232,160,32,0.11)] text-[#E8A020] shadow-sm"
                  : "text-[#AEA898] hover:bg-[rgba(100,95,120,0.18)] hover:text-[#EDE8DE]"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                  active ? "text-[#E8A020]" : "text-[#AEA898]"
                }`}
                aria-hidden
              />
              <span
                className={`whitespace-nowrap transition-colors duration-150 ${
                  active ? "text-cyan-300" : ""
                }`}
              >
                {label}
              </span>

              {/* Active dot indicator */}
              {active && (
                <span
                  className="absolute -bottom-[13px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#E8A020] shadow-[0_0_10px_rgba(232,160,32,0.85)]"
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
