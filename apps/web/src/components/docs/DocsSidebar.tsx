"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  title: string;
  href?: string;
  children?: SidebarItem[];
}

interface DocsSidebarProps {
  items: SidebarItem[];
}

export function DocsSidebar({ items }: DocsSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <nav className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4">
        <ul className="space-y-1">
          {items.map((item) => (
            <SidebarGroup key={item.title} item={item} depth={0} />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

function SidebarGroup({ item, depth }: { item: SidebarItem; depth: number }) {
  const pathname = usePathname();
  const isActive = item.href ? pathname === item.href : false;
  const hasActiveChild = item.children?.some(
    (child) =>
      child.href === pathname ||
      child.children?.some((c) => c.href === pathname)
  );
  const [open, setOpen] = useState(isActive || hasActiveChild || depth === 0);

  if (item.children && item.children.length > 0) {
    return (
      <li>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center justify-between w-full px-3 py-1.5 text-sm rounded-md transition-colors",
            depth === 0
              ? "font-semibold text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>{item.title}</span>
          <svg
            className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {open && (
          <ul className="ml-3 mt-0.5 border-l border-border pl-3 space-y-0.5">
            {item.children.map((child) => (
              <SidebarGroup key={child.title} item={child} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href || "#"}
        className={cn(
          "block px-3 py-1.5 text-sm rounded-md transition-colors",
          isActive
            ? "bg-accent/10 text-accent font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        {item.title}
      </Link>
    </li>
  );
}
