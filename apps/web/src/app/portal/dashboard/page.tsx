"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

interface AppSummary {
  id: string;
  name: string;
  state: string;
}

interface DashboardData {
  apps: AppSummary[];
  totalApps: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/rainbow/applications");
        if (res.ok) {
          const json = await res.json();
          const apps = json.data || [];
          setData({
            apps: apps.slice(0, 5),
            totalApps: json.total || apps.length,
          });
        }
      } catch {
        // Apps API may not be available yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{user ? `, ${user.firstName}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s an overview of your developer account.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Applications"
          value={loading ? "..." : String(data?.totalApps ?? 0)}
          href="/portal/applications"
        />
        <StatCard label="Environment" value="Sandbox" href="/portal/sandbox" />
        <StatCard label="Plan" value="Developer" href="/portal/billing" />
      </div>

      {/* Recent apps */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Applications</h2>
          <Link
            href="/portal/applications/new"
            className="text-sm text-primary hover:underline"
          >
            + New App
          </Link>
        </div>
        <div className="mt-4 rounded-lg border border-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : data?.apps.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {data.apps.map((app) => (
                  <tr key={app.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{app.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          app.state === "deployed"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {app.state || "stopped"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/portal/applications?id=${app.id}`}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No applications yet.{" "}
              <Link
                href="/portal/applications/new"
                className="text-primary hover:underline"
              >
                Create your first app
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold">Quick Links</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            title="Getting Started"
            description="Learn how to integrate Rainbow APIs"
            href="/docs/getting-started"
          />
          <QuickLink
            title="API Reference"
            description="Explore all available endpoints"
            href="/api-reference"
          />
          <QuickLink
            title="SDKs"
            description="Download SDKs for your platform"
            href="/docs/sdk"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30"
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Link>
  );
}

function QuickLink({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
