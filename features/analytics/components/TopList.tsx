"use client";

export interface TopListItem {
  id: string;
  name: string;
  detail: string;
  revenue: number;
  revenueLabel: string;
}

export function TopList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: TopListItem[];
  emptyLabel: string;
}) {
  const max = Math.max(...items.map((i) => i.revenue), 0);

  return (
    <section>
      <h2 className="mb-4 type-section">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-start gap-3">
              <span className="w-4 shrink-0 pt-0.5 text-right font-mono text-sm text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-semibold">{item.name}</span>
                  <span className="shrink-0 text-sm font-semibold">{item.revenueLabel}</span>
                </div>
                <div className="text-xs text-muted-foreground">{item.detail}</div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-sm bg-muted" aria-hidden>
                  <div
                    className="h-full rounded-sm bg-primary"
                    style={{ width: max > 0 ? `${(item.revenue / max) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
