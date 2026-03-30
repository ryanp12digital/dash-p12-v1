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
        className="flex items-center gap-1 rounded-2xl border border-[#e2e8f0] bg-white/95 px-2 py-2 shadow-[0_8px_32px_rgba(7,41,207,0.10),0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-md"
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
              className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                active
                  ? "bg-white text-[#0729cf] shadow-sm"
                  : "text-[#0f172a] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors duration-150 ${
                  active ? "text-[#0729cf]" : "text-[#0f172a]"
                }`}
                aria-hidden
              />
              <span
                className={`whitespace-nowrap transition-colors duration-150 ${
                  active ? "text-[#0729cf]" : ""
                }`}
              >
                {label}
              </span>

              {/* Active dot indicator */}
              {active && (
                <span
                  className="absolute -bottom-[13px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#0729cf]"
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
