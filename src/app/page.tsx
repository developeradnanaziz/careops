import Link from "next/link";
import {
  CalendarDays,
  MessageSquare,
  Users,
  Package,
  ArrowRight,
} from "lucide-react";

const features = [
  { icon: CalendarDays, title: "Bookings", desc: "Schedule and manage appointments" },
  { icon: MessageSquare, title: "Inbox", desc: "Automated conversations with contacts" },
  { icon: Users, title: "Contacts", desc: "Track all your clients in one place" },
  { icon: Package, title: "Inventory", desc: "Monitor stock levels and alerts" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <div className="bg-zinc-900 text-white text-xs font-medium px-3 py-1 rounded-full mb-6">
          Hackathon MVP
        </div>
        <h1 className="text-5xl font-bold text-zinc-900 mb-3 text-center">CareOps</h1>
        <p className="text-lg text-zinc-500 mb-10 text-center max-w-md">
          Unified operations platform for bookings, contacts, messaging, and inventory.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Link
            href="/booking"
            className="flex-1 bg-zinc-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-zinc-800 transition-colors text-center flex items-center justify-center gap-2"
          >
            Book Appointment <ArrowRight size={14} />
          </Link>
          <Link
            href="/login"
            className="flex-1 border border-zinc-300 text-zinc-900 rounded-lg py-3 text-sm font-medium hover:bg-zinc-100 transition-colors text-center"
          >
            Admin Sign In
          </Link>
        </div>
        <Link
          href="/contact"
          className="text-sm text-zinc-500 hover:text-zinc-800 mt-4 underline underline-offset-2"
        >
          Or send us a message →
        </Link>
      </div>

      {/* Features grid */}
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm"
            >
              <Icon size={20} className="text-zinc-700 mb-3" />
              <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
              <p className="text-xs text-zinc-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
