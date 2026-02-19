"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SearchResult {
  id: string;
  title: string;
  path: string;
  excerpt: string;
  type: string;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else {
          // Parent should handle opening
        }
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      }
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      window.location.href = results[selectedIndex].path;
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <svg className="h-5 w-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="flex-1 py-4 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
            aria-label="Search documentation"
          />
          <kbd className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.map((result, i) => (
            <a
              key={result.id}
              href={result.path}
              className={`flex flex-col gap-0.5 px-4 py-3 text-sm transition-colors ${
                i === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
              }`}
              onClick={onClose}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium uppercase">
                  {result.type}
                </span>
                <span className="font-medium text-foreground">{result.title}</span>
              </div>
              <span className="text-muted-foreground text-xs line-clamp-1">
                {result.excerpt}
              </span>
            </a>
          ))}
        </div>

        {/* Footer hint */}
        {query.length < 2 && (
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center gap-4">
            <span>Type to search across all documentation</span>
          </div>
        )}
      </div>
    </div>
  );
}
