"use client";

import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isUnconfirmed = error.toLowerCase().includes("email not confirmed");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResent(false);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleResend = async () => {
    setResending(true);
    await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    setResent(true);
  };

  return (
    <div className="max-w-sm w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
        <p className="text-sm text-zinc-500 mt-1">Sign in to your CareOps account</p>
      </div>

      <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
        {error && (
          <div className={`rounded-lg p-3 text-sm ${
            isUnconfirmed
              ? "bg-amber-50 border border-amber-200 text-amber-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {isUnconfirmed ? (
              <>
                <p className="font-medium mb-1">Email not confirmed</p>
                <p className="text-xs mb-2">
                  Please check your inbox for a confirmation link before signing in.
                </p>
                {resent ? (
                  <p className="text-xs text-green-600 font-medium">Confirmation email resent!</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-xs font-medium underline hover:no-underline"
                  >
                    {resending ? "Sending..." : "Resend confirmation email"}
                  </button>
                )}
              </>
            ) : (
              error
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-zinc-900 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
