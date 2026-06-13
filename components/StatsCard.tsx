import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: "indigo" | "green" | "gray" | "amber";
  description?: string;
}

const colorMap = {
  indigo: {
    bg: "bg-indigo-50",
    icon: "bg-indigo-100 text-indigo-600",
    value: "text-indigo-700",
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-100 text-green-600",
    value: "text-green-700",
  },
  gray: {
    bg: "bg-gray-50",
    icon: "bg-gray-100 text-gray-600",
    value: "text-gray-700",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    value: "text-amber-700",
  },
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className="card p-6 flex items-center gap-4"
      data-testid="stats-card"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.icon} shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}
