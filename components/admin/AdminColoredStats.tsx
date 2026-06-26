"use client";

import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

export type ColoredStatTone = "purple" | "gold" | "blue" | "green" | "orange" | "red";

export type ColoredStatItem = {
  icon: LucideIcon;
  tone: ColoredStatTone;
  value: number | string;
  label: string;
  sub: string;
  progress?: number;
};

export function ColoredStatCard({ icon, tone, value, label, sub, progress }: ColoredStatItem) {
  return (
    <article className={`admin-tables-stat-card admin-tables-stat-${tone}`}>
      <div className="admin-tables-stat-header">
        <div className="admin-tables-stat-icon">
          <Icon icon={icon} size={18} strokeWidth={1.75} />
        </div>
        <span className="admin-tables-stat-label">{label}</span>
      </div>
      <div className="admin-tables-stat-value">{value}</div>
      <p className="admin-tables-stat-sub">{sub}</p>
      {progress != null && (
        <div className="admin-tables-stat-progress" aria-hidden>
          <div className="admin-tables-stat-progress-bar" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
    </article>
  );
}

export function ColoredStatsGrid({ items, className }: { items: ColoredStatItem[]; className?: string }) {
  return (
    <div className={`admin-tables-stats${className ? ` ${className}` : ""}`}>
      {items.map((item) => (
        <ColoredStatCard key={item.label} {...item} />
      ))}
    </div>
  );
}
