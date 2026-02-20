"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  PortalSidebar,
  PortalMobileNav,
} from "@/components/portal/PortalSidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <PortalSidebar />
      <div className="flex flex-1 flex-col">
        {/* Portal top bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="text-sm text-muted-foreground">
            {user && (
              <>
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.loginEmail}
                </span>
              </>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
        <PortalMobileNav />
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
