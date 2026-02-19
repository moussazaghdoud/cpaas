"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  language?: string;
  code: string;
}

interface CodeTabsProps {
  tabs: Tab[];
}

export function CodeTabs({ tabs }: CodeTabsProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="my-4 rounded-xl border border-border overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border bg-muted/50">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors",
              i === active
                ? "text-foreground bg-background border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code */}
      <pre className="p-4 overflow-x-auto bg-muted/30">
        <code className="text-sm font-mono leading-relaxed">{tabs[active].code}</code>
      </pre>
    </div>
  );
}
