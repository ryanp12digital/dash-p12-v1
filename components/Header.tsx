"use client";
import { Search, Bell } from "lucide-react";

const navLinks = ["Dashboard", "Analytics", "Campaigns", "Reports"];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[#e2e8f0]">
      <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0729cf] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P12</span>
            </div>
            <span className="font-bold text-[#0f172a] text-xl tracking-tight">P12 Digital</span>
          </div>
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className={`text-sm font-medium pb-1 ${
                  link === "Dashboard"
                    ? "text-[#0729cf] border-b-2 border-[#0729cf] font-semibold"
                    : "text-[#64748b] hover:text-[#0729cf] transition-colors"
                }`}
              >
                {link}
              </a>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search data..."
              className="bg-[#f1f5f9] rounded-xl pl-9 pr-4 py-2 text-sm text-[#6b7280] outline-none w-56 focus:ring-2 focus:ring-[#0729cf]/20"
            />
          </div>
          <button className="p-2 rounded-xl hover:bg-[#f1f5f9] transition-colors">
            <Bell className="w-5 h-5 text-[#64748b]" />
          </button>
          <div className="w-px h-8 bg-[#e2e8f0]" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-[#0f172a]">Marketing Admin</p>
              <p className="text-[10px] text-[#64748b]">Premium Account</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#0729cf] flex items-center justify-center text-white text-sm font-bold">
              MA
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
