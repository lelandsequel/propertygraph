"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWatchlist } from "@/lib/watchlist";

const navLinks = [
  { href: "/", label: "Search" },
  { href: "/markets", label: "Markets" },
  { href: "/signals", label: "Signals" },
  { href: "/insights", label: "Insights" },
];

export function NavBar() {
  const pathname = usePathname();
  const { count } = useWatchlist();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-bold tracking-widest text-white hover:text-accent transition-colors">
            PROPERTYGRAPH
          </Link>
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs tracking-wide transition-colors ${
                    active
                      ? "text-accent bg-accent/10"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/watchlist"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wide transition-colors ${
              pathname === "/watchlist" ? "text-accent bg-accent/10" : "text-zinc-500 hover:text-white"
            }`}
          >
            Watchlist
            {count > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center">
                {count}
              </span>
            )}
          </Link>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-green inline-block" />
            ACTIVE INDEX
          </span>
        </div>
      </div>
    </nav>
  );
}
