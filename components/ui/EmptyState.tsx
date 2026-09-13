import type { ReactNode } from "react";

export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line px-4 py-10 text-center">
      <span className="text-4xl">{icon}</span>
      <div className="font-extrabold">{title}</div>
      {hint && <div className="max-w-xs text-sm text-ink-soft">{hint}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
