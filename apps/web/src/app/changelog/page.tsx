import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Rainbow CPaaS platform changelog — latest updates, new features, and fixes.",
};

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="max-w-2xl mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Changelog
        </h1>
        <p className="text-lg text-muted-foreground">
          Latest updates and changes to the Rainbow CPaaS platform.
        </p>
      </div>

      <div className="max-w-2xl space-y-8">
        <p className="text-sm text-muted-foreground">
          Changelog entries will be populated from the Rainbow developer portal
          after running the content sync pipeline.
        </p>
        <div className="p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            Run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">pnpm content:sync</code> to
            fetch the latest release notes from the source site.
          </p>
        </div>
      </div>
    </div>
  );
}
