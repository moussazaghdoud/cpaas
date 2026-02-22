"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { NAV_ITEMS, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SearchModal } from "@/components/ui/SearchModal";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  label: string;
  url?: string;
  href?: string;
}

export function Header() {
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, loading } = useAuth();
  const [navItems, setNavItems] = useState<NavItem[]>(
    NAV_ITEMS.map((item) => ({ label: item.label, href: item.href }))
  );

  // Try to fetch navigation from CMS on mount
  useEffect(() => {
    fetch("/api/payload/globals/navigation")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("not available");
      })
      .then((data) => {
        if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
          setNavItems(data.items);
        }
      })
      .catch(() => {
        // CMS not available — keep constants fallback
      });
  }, []);

  const getHref = (item: NavItem) => item.url || item.href || "/";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <img src="/rainbow-logo.png" alt="Rainbow" className="h-8 w-8" />
            <span className="leading-tight text-sm">
              <span className="block text-base font-bold">Rainbow</span>
              <span className="block text-[11px] font-medium text-muted-foreground">For Developers</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={getHref(item)}
                href={getHref(item)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname.startsWith(getHref(item))
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search...</span>
              <kbd className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Ctrl K
              </kbd>
            </button>

            {!loading && (
              user ? (
                <Link
                  href="/portal/dashboard"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Portal
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Sign in
                </Link>
              )
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="flex flex-col p-4 gap-1">
              {navItems.map((item) => (
                <Link
                  key={getHref(item)}
                  href={getHref(item)}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname.startsWith(getHref(item))
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {!loading && (
                user ? (
                  <Link
                    href="/portal/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 px-4 py-2 text-sm font-medium text-center bg-primary text-primary-foreground rounded-lg"
                  >
                    Portal
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 px-4 py-2 text-sm font-medium text-center bg-primary text-primary-foreground rounded-lg"
                  >
                    Sign in
                  </Link>
                )
              )}
            </nav>
          </div>
        )}
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
