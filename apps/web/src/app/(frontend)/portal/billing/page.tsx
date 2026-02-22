"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

interface Subscription {
  id: string;
  offerId: string;
  offerName: string;
  status: string;
  maxNumberUsers?: number;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
}

export default function BillingPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [subsRes, invRes] = await Promise.allSettled([
          fetch(
            `/api/rainbow/subscription/v1.0/companies/${user!.companyId}/subscriptions`
          ),
          fetch(
            `/api/rainbow/subscription/v1.0/companies/${user!.companyId}/invoices`
          ),
        ]);

        if (subsRes.status === "fulfilled" && subsRes.value.ok) {
          const data = await subsRes.value.json();
          setSubscriptions(data.data || []);
        }
        if (invRes.status === "fulfilled" && invRes.value.ok) {
          const data = await invRes.value.json();
          setInvoices(data.data || []);
        }
      } catch {
        // Billing APIs may not be available
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your subscriptions and view invoices
        </p>
      </div>

      {/* Subscriptions */}
      <div>
        <h2 className="text-lg font-semibold">Subscriptions</h2>
        <div className="mt-4 rounded-lg border border-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No active subscriptions. You are on the free Developer plan.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Users</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {sub.offerName || sub.offerId}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.maxNumberUsers || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h2 className="text-lg font-semibold">Invoices</h2>
        <div className="mt-4 rounded-lg border border-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No invoices available.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Invoice #</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{inv.number}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {inv.amount} {inv.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
