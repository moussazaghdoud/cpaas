"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings?: TocItem[];
}

export function TableOfContents({ headings: propHeadings }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>(propHeadings || []);
  const [activeId, setActiveId] = useState<string>("");

  // Auto-extract headings from DOM if not provided
  useEffect(() => {
    if (propHeadings) return;
    const els = document.querySelectorAll(".prose h2, .prose h3");
    const items: TocItem[] = Array.from(els).map((el) => ({
      id: el.id,
      text: el.textContent || "",
      level: parseInt(el.tagName[1]),
    }));
    setHeadings(items);
  }, [propHeadings]);

  // Intersection observer for active heading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0% -80% 0%" }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="hidden xl:block w-56 flex-shrink-0">
      <div className="sticky top-20">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          On this page
        </h4>
        <ul className="space-y-1">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={cn(
                  "block text-xs py-1 transition-colors",
                  h.level === 3 && "pl-3",
                  activeId === h.id
                    ? "text-accent font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
