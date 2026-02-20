"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { markdownToHtml } from "@/lib/markdown";

export default function ContentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = params.slug as string;
  const slug = decodeURIComponent(rawSlug).replace(/~/g, "/");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const encoded = encodeURIComponent(rawSlug);
      const res = await fetch(`/api/cms/pages/${encoded}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title);
        setDescription(data.description);
        setType(data.type);
        setContent(data.content);
      } else {
        setError("Page not found");
      }
      setLoading(false);
    }
    load();
  }, [rawSlug]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    const encoded = encodeURIComponent(rawSlug);
    const res = await fetch(`/api/cms/pages/${encoded}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, description, type, content }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save");
    }
    setSaving(false);
  }, [rawSlug, title, description, type, content]);

  // Ctrl+S to save
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  // Compute live doc URL
  const docUrl = slug.startsWith("doc/") ? "/docs/" + slug.slice(4).replace(/__/g, "/") : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-red-500">{error}</p>
        <Link href="/portal/content" className="mt-4 inline-block text-primary hover:underline">
          Back to content list
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/portal/content" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Edit Page</h1>
          <span className="text-sm text-muted-foreground">{slug}</span>
        </div>
        <div className="flex items-center gap-3">
          {docUrl && (
            <Link
              href={docUrl}
              target="_blank"
              className="text-sm text-primary hover:underline"
            >
              View live &rarr;
            </Link>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm text-green-500">Saved successfully!</p>}

      {/* Meta fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">None</option>
            <option value="documentation">Documentation</option>
            <option value="guide">Guide</option>
            <option value="api">API</option>
            <option value="sdk">SDK</option>
            <option value="faq">FAQ</option>
          </select>
        </div>
      </div>

      {/* Split pane: editor + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Markdown Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full rounded-lg border border-border bg-background p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Write your markdown content here..."
          />
        </div>
        <div className="flex flex-col">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Preview</label>
          <div
            className="flex-1 rounded-lg border border-border bg-background p-4 overflow-auto prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          />
        </div>
      </div>
    </div>
  );
}
