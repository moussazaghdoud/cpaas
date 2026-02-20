"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CmsEditButton({ slug }: { slug: string }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/cms/check-admin")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.admin))
      .catch(() => {});
  }, []);

  if (!isAdmin) return null;

  const encoded = encodeURIComponent(slug.replace(/\//g, "~"));

  return (
    <Link
      href={`/portal/content/${encoded}`}
      title="Edit this page"
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </Link>
  );
}
