"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Application {
  id: string;
  name: string;
  state: string;
  env: string;
  dateOfCreation: string;
  kpi?: { activatedUsers?: number };
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApps();
  }, []);

  async function fetchApps() {
    setLoading(true);
    try {
      const res = await fetch("/api/rainbow/applications");
      if (!res.ok) throw new Error("Failed to load applications");
      const json = await res.json();
      setApps(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeploy(appId: string) {
    try {
      const res = await fetch(`/api/rainbow/applications/${appId}?action=deploy`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Deploy failed");
        return;
      }
      fetchApps();
    } catch {
      alert("Deploy failed");
    }
  }

  async function handleStop(appId: string) {
    try {
      const res = await fetch(`/api/rainbow/applications/${appId}?action=stop`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Stop failed");
        return;
      }
      fetchApps();
    } catch {
      alert("Stop failed");
    }
  }

  async function handleDelete(appId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/rainbow/applications/${appId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Delete failed");
        return;
      }
      fetchApps();
    } catch {
      alert("Delete failed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your Rainbow applications
          </p>
        </div>
        <Link
          href="/portal/applications/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Create Application
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-border">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading applications...
          </div>
        ) : apps.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No applications yet.{" "}
            <Link
              href="/portal/applications/new"
              className="text-primary hover:underline"
            >
              Create your first app
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Environment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{app.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {app.env || "sandbox"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        app.state === "deployed"
                          ? "bg-green-500/10 text-green-400"
                          : app.state === "stopped"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {app.state || "new"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {app.dateOfCreation
                      ? new Date(app.dateOfCreation).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {app.state !== "deployed" && (
                        <button
                          onClick={() => handleDeploy(app.id)}
                          className="text-xs text-green-400 hover:underline"
                        >
                          Deploy
                        </button>
                      )}
                      {app.state === "deployed" && (
                        <button
                          onClick={() => handleStop(app.id)}
                          className="text-xs text-yellow-400 hover:underline"
                        >
                          Stop
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(app.id, app.name)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
