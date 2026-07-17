import { LucideIcon } from "lucide-react";

export interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  color: "brand" | "emerald" | "stone" | "amber";
  description?: string;
}

const colorMap = {
  brand: "from-brand-500 to-brand-700 shadow-brand-900/30",
  emerald: "from-emerald-500 to-emerald-700 shadow-emerald-900/30",
  stone: "from-inverse-from to-inverse-to shadow-black/30",
  amber: "from-amber-500 to-amber-700 shadow-amber-900/30",
};

export default function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" data-testid="stats-grid">
      {items.map(({ label, value, icon: Icon, color, description }) => (
        <div
          key={label}
          data-testid="stats-card"
          data-stat-tile
          data-tone={color}
          className={`bg-gradient-to-br px-5 py-5 text-white shadow-lg ring-1 ring-inset ring-white/15 ${colorMap[color]}`}
        >
          <div data-tile-icon className="flex items-center gap-1.5 text-white/70">
            <Icon size={13} strokeWidth={1.75} />
            <p className="text-[11px] font-medium uppercase tracking-[0.1em]">{label}</p>
          </div>
          <p data-tile-value className="mt-2 font-display text-3xl font-semibold tabular-nums drop-shadow-sm">{value}</p>
          {description && <p data-tile-meta className="mt-0.5 text-xs text-white/60">{description}</p>}
        </div>
      ))}
    </div>
  );
}
