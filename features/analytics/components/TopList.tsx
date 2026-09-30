"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {items.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-muted-foreground sm:px-6">{emptyLabel}</p>
      ) : (
        <ol className="flex flex-col gap-4 px-5 pb-6 sm:px-6">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-semibold">{item.name}</span>
                  <span className="shrink-0 text-sm font-semibold">{item.revenueLabel}</span>
                </div>
                <div className="text-xs text-muted-foreground">{item.detail}</div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: max > 0 ? `${(item.revenue / max) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
