const statusStyles: Record<string, string> = {
  // Booking statuses
  confirmed: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  "no-show": "bg-zinc-100 text-zinc-600 border-zinc-200",
  // Conversation statuses
  open: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-zinc-100 text-zinc-600 border-zinc-200",
  archived: "bg-zinc-50 text-zinc-400 border-zinc-200",
  // Inventory
  "in-stock": "bg-green-50 text-green-700 border-green-200",
  "low-stock": "bg-red-50 text-red-600 border-red-200",
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = statusStyles[status] ?? "bg-zinc-100 text-zinc-600 border-zinc-200";
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span className={`inline-flex items-center rounded border font-medium ${style} ${sizeClass}`}>
      {status}
    </span>
  );
}
