import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: string; // tailwind bg color class for icon circle
  href?: string; // optional link to make the card clickable
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "bg-zinc-100",
  href,
}: StatCardProps) {
  const content = (
    <div className={`bg-white rounded-xl border border-zinc-200 p-5 flex items-start gap-4 ${href ? "hover:border-zinc-300 hover:shadow-sm transition-all" : ""}`}>
      <div className={`${accent} rounded-lg p-2.5 flex-shrink-0`}>
        <Icon size={20} className="text-zinc-700" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-zinc-500">{label}</p>
        <p className="text-2xl font-bold text-zinc-900 mt-0.5">{value}</p>
        {trend && (
          <p
            className={`text-xs mt-1 font-medium ${
              trend.positive ? "text-green-600" : "text-red-500"
            }`}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
