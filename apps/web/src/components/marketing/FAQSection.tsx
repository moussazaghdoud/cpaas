"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FAQItem {
  id?: string;
  question?: string;
  answer?: unknown;
}

interface FAQBlockData {
  heading?: string;
  items?: FAQItem[];
}

function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  if (typeof n.text === "string") return n.text;
  if (Array.isArray(n.children)) return n.children.map(extractText).join("");
  if (n.root) return extractText(n.root);
  return "";
}

function FAQItemCard({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  const answerText = typeof item.answer === "string" ? item.answer : extractText(item.answer);

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--muted)]/30 transition-colors"
      >
        <span className="font-medium text-[var(--foreground)]">{item.question}</span>
        <svg
          className={cn("h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform", open && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-[var(--muted-foreground)] leading-relaxed">
          {answerText}
        </div>
      )}
    </div>
  );
}

export function FAQSection({ data }: { data?: Record<string, unknown> }) {
  const d = (data || {}) as FAQBlockData;
  const heading = d.heading || "Frequently Asked Questions";
  const items = d.items || [];

  if (items.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-8">{heading}</h2>
        <div className="space-y-2">
          {items.map((item, i) => (
            <FAQItemCard key={item.id || i} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
