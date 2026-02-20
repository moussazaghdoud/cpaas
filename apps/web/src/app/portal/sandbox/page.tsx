"use client";

import { useAuth } from "@/lib/auth-context";

export default function SandboxPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Sandbox Environment</h1>
        <p className="mt-1 text-muted-foreground">
          Your sandbox environment for development and testing
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-medium">Sandbox API</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Base URL for sandbox API calls
          </p>
          <code className="mt-3 block rounded bg-muted px-3 py-2 text-sm">
            https://sandbox.openrainbow.com
          </code>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-medium">Status</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-sm text-green-400">Active</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your sandbox environment is ready for use
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-medium">Account Details</h3>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.loginEmail || "—"}</span>
          </div>
          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted-foreground">Company ID</span>
            <span className="font-mono text-xs">{user?.companyId || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">JID</span>
            <span className="font-mono text-xs">{user?.jid_im || "—"}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-medium">Getting Started</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the sandbox environment to build and test your Rainbow
          integrations without affecting production data.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            Create an application in the Applications section
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            Use your app credentials to authenticate API calls
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            Test with the sandbox base URL above
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            Request deployment when ready for production
          </li>
        </ul>
      </div>
    </div>
  );
}
