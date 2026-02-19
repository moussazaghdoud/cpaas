import { cn } from "@/lib/utils";

interface CalloutProps {
  type?: "note" | "tip" | "warning" | "danger" | "info";
  title?: string;
  children: React.ReactNode;
}

const STYLES = {
  note: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    icon: "text-blue-400",
    title: "Note",
  },
  tip: {
    border: "border-green-500/30",
    bg: "bg-green-500/5",
    icon: "text-green-400",
    title: "Tip",
  },
  warning: {
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    icon: "text-yellow-400",
    title: "Warning",
  },
  danger: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    icon: "text-red-400",
    title: "Danger",
  },
  info: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    icon: "text-purple-400",
    title: "Info",
  },
};

export function Callout({ type = "note", title, children }: CalloutProps) {
  const style = STYLES[type];

  return (
    <div
      className={cn(
        "my-4 rounded-lg border-l-4 p-4",
        style.border,
        style.bg
      )}
      role="note"
    >
      <div className={cn("font-semibold text-sm mb-1", style.icon)}>
        {title || style.title}
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed [&>p]:mb-0">
        {children}
      </div>
    </div>
  );
}
